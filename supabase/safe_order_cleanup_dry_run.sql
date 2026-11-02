-- ============================================================================
-- PLANMYCHOICE PRODUCTION ORDER CLEANUP SCRIPT (DRY-RUN DEFAULT)
-- Verified against backup: orders_backup_2026-11-01T12-51-07-481Z.json
-- Features:
--   1. GET DIAGNOSTICS ROW_COUNT captures actual rows deleted
--   2. Strict assertions on deleted counts: 46 orders, 287 notifs, 47 audits
--   3. Dynamic verification report populated strictly from captured counts
--   4. Preserves partner notification '94719e64-9d85-4680-90e1-ce14fc1e323d'
--   5. Verifies all 82 administrative audit logs remain intact
--   6. Strict pre/post assertions for caterers=2, profiles=12, settings=1
--   7. ROLLBACK by default for safe dry-run execution
-- ============================================================================

BEGIN;

-- Temporary report table (session-scoped, dropped automatically on rollback/commit)
CREATE TEMP TABLE IF NOT EXISTS cleanup_report (
    entity TEXT,
    count_before INT,
    actual_deleted INT,
    count_after INT,
    expected_deleted INT,
    expected_remaining INT,
    status TEXT
) ON COMMIT DROP;

TRUNCATE cleanup_report;

DO $$
DECLARE
    -- Measured pre-execution counts
    v_orders_before         INT;
    v_notifs_before         INT;
    v_audits_before         INT;
    v_caterers_before       INT;
    v_profiles_before       INT;
    v_settings_before       INT;
    v_target_notifs_before  INT;
    v_target_audits_before  INT;
    v_admin_audits_before   INT;
    v_partner_exists_before BOOLEAN;

    -- Dynamically captured deletion counts (via GET DIAGNOSTICS)
    v_notifs_deleted        INT := 0;
    v_audits_deleted        INT := 0;
    v_orders_deleted        INT := 0;

    -- Measured post-execution counts
    v_orders_after          INT;
    v_notifs_after          INT;
    v_audits_after          INT;
    v_caterers_after        INT;
    v_profiles_after        INT;
    v_settings_after        INT;
    v_partner_exists_after  BOOLEAN;

    -- Constants for partner notification verification
    c_partner_id            CONSTANT TEXT := '94719e64-9d85-4680-90e1-ce14fc1e323d';
    c_partner_title         CONSTANT TEXT := 'New Partner Registration 🏢';
BEGIN
    -- ========================================================================
    -- 1. PRE-EXECUTION CHECKS & BASELINE ASSERTIONS
    -- ========================================================================
    
    -- 1A. Orders pre-check (must be exactly 46)
    SELECT COUNT(*) INTO v_orders_before FROM public.orders;
    IF v_orders_before <> 46 THEN
        RAISE EXCEPTION 'PRE-CHECK FAILED: Expected 46 orders, found %', v_orders_before;
    END IF;

    -- 1B. Notifications total & target pre-check (must be total 288, target 287)
    SELECT COUNT(*) INTO v_notifs_before FROM public.notifications;
    SELECT COUNT(*) INTO v_target_notifs_before 
    FROM public.notifications
    WHERE TRIM(COALESCE("orderId", '')) <> ''
      AND title IN (
          'Event Completed 🎉',
          'New Order Created 🔔',
          'Order Approved! 🎉',
          'Order Approved',
          'New Order Received 🧑‍🍳',
          'Order Status Adjusted by Admin',
          'New Booking Submitted 📨',
          'Order Force Updated',
          'Details Requested'
      );
    IF v_target_notifs_before <> 287 THEN
        RAISE EXCEPTION 'PRE-CHECK FAILED: Expected 287 target order notifications, found % (total: %)', 
            v_target_notifs_before, v_notifs_before;
    END IF;

    -- 1C. Partner notification pre-check (must exist with exact ID and title)
    SELECT EXISTS (
        SELECT 1 FROM public.notifications 
        WHERE id = c_partner_id AND title = c_partner_title
    ) INTO v_partner_exists_before;
    IF NOT v_partner_exists_before THEN
        RAISE EXCEPTION 'PRE-CHECK FAILED: Partner notification % ("%") not found in public.notifications!', 
            c_partner_id, c_partner_title;
    END IF;

    -- 1D. Audit logs total & target pre-check (must be total 129, target 47, admin 82)
    SELECT COUNT(*) INTO v_audits_before FROM public.audit_logs;
    SELECT COUNT(*) INTO v_target_audits_before 
    FROM public.audit_logs
    WHERE (
        (action = 'Force status: Approved' AND details LIKE 'User action on entity: Order #%')
        OR (action = 'Order approved' AND details LIKE 'Order %: Order approved by %')
        OR (action = 'Order changes requested' AND details LIKE 'Order %: Order changes requested by %')
        OR (action = 'Order Deleted' AND (details LIKE 'Admin permanently deleted order #%' OR details LIKE 'User action on entity: Order #%'))
    );
    IF v_target_audits_before <> 47 THEN
        RAISE EXCEPTION 'PRE-CHECK FAILED: Expected 47 target order audit logs, found % (total: %)', 
            v_target_audits_before, v_audits_before;
    END IF;

    v_admin_audits_before := v_audits_before - v_target_audits_before;
    IF v_admin_audits_before <> 82 THEN
        RAISE EXCEPTION 'PRE-CHECK FAILED: Expected 82 admin audit logs to preserve, found %', v_admin_audits_before;
    END IF;

    -- 1E. Core entity baseline pre-checks (caterers=2, profiles=12, settings=1)
    SELECT COUNT(*) INTO v_caterers_before FROM public.caterer_registrations;
    IF v_caterers_before <> 2 THEN
        RAISE EXCEPTION 'PRE-CHECK FAILED: Expected 2 caterers, found %', v_caterers_before;
    END IF;

    SELECT COUNT(*) INTO v_profiles_before FROM public.profiles;
    IF v_profiles_before <> 12 THEN
        RAISE EXCEPTION 'PRE-CHECK FAILED: Expected 12 profiles, found %', v_profiles_before;
    END IF;

    SELECT COUNT(*) INTO v_settings_before FROM public.platform_settings;
    IF v_settings_before <> 1 THEN
        RAISE EXCEPTION 'PRE-CHECK FAILED: Expected 1 platform settings record, found %', v_settings_before;
    END IF;


    -- ========================================================================
    -- 2. EXECUTING DELETIONS WITH GET DIAGNOSTICS ROW_COUNT
    -- ========================================================================

    -- 2A. Delete order-dependent notifications
    DELETE FROM public.notifications
    WHERE TRIM(COALESCE("orderId", '')) <> ''
      AND title IN (
          'Event Completed 🎉',
          'New Order Created 🔔',
          'Order Approved! 🎉',
          'Order Approved',
          'New Order Received 🧑‍🍳',
          'Order Status Adjusted by Admin',
          'New Booking Submitted 📨',
          'Order Force Updated',
          'Details Requested'
      );
    GET DIAGNOSTICS v_notifs_deleted = ROW_COUNT;
    IF v_notifs_deleted <> 287 THEN
        RAISE EXCEPTION 'DELETION ASSERTION FAILED: Deleted % notifications (expected exactly 287)', v_notifs_deleted;
    END IF;

    -- 2B. Delete order-specific audit records
    DELETE FROM public.audit_logs
    WHERE (
        (action = 'Force status: Approved' AND details LIKE 'User action on entity: Order #%')
        OR (action = 'Order approved' AND details LIKE 'Order %: Order approved by %')
        OR (action = 'Order changes requested' AND details LIKE 'Order %: Order changes requested by %')
        OR (action = 'Order Deleted' AND (details LIKE 'Admin permanently deleted order #%' OR details LIKE 'User action on entity: Order #%'))
    );
    GET DIAGNOSTICS v_audits_deleted = ROW_COUNT;
    IF v_audits_deleted <> 47 THEN
        RAISE EXCEPTION 'DELETION ASSERTION FAILED: Deleted % audit logs (expected exactly 47)', v_audits_deleted;
    END IF;

    -- 2C. Delete all 46 orders
    DELETE FROM public.orders;
    GET DIAGNOSTICS v_orders_deleted = ROW_COUNT;
    IF v_orders_deleted <> 46 THEN
        RAISE EXCEPTION 'DELETION ASSERTION FAILED: Deleted % orders (expected exactly 46)', v_orders_deleted;
    END IF;


    -- ========================================================================
    -- 3. POST-EXECUTION INTEGRITY ASSERTIONS
    -- ========================================================================

    -- 3A. Orders post-check (must be exactly 0)
    SELECT COUNT(*) INTO v_orders_after FROM public.orders;
    IF v_orders_after <> 0 THEN
        RAISE EXCEPTION 'POST-CHECK FAILED: % orders remain (expected 0)', v_orders_after;
    END IF;

    -- 3B. Notifications post-check (must be exactly 1: the partner notification)
    SELECT COUNT(*) INTO v_notifs_after FROM public.notifications;
    IF v_notifs_after <> 1 THEN
        RAISE EXCEPTION 'POST-CHECK FAILED: % notifications remain (expected exactly 1)', v_notifs_after;
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM public.notifications 
        WHERE id = c_partner_id AND title = c_partner_title
    ) INTO v_partner_exists_after;
    IF NOT v_partner_exists_after THEN
        RAISE EXCEPTION 'POST-CHECK FAILED: Partner notification % was deleted or altered!', c_partner_id;
    END IF;

    -- 3C. Audit logs post-check (must be exactly 82 admin records)
    SELECT COUNT(*) INTO v_audits_after FROM public.audit_logs;
    IF v_audits_after <> 82 THEN
        RAISE EXCEPTION 'POST-CHECK FAILED: % audit logs remain (expected exactly 82 admin records)', v_audits_after;
    END IF;

    -- 3D. Core entity post-checks (must remain unchanged: caterers=2, profiles=12, settings=1)
    SELECT COUNT(*) INTO v_caterers_after FROM public.caterer_registrations;
    IF v_caterers_after <> 2 THEN
        RAISE EXCEPTION 'POST-CHECK FAILED: Caterers count altered: % (expected 2)', v_caterers_after;
    END IF;

    SELECT COUNT(*) INTO v_profiles_after FROM public.profiles;
    IF v_profiles_after <> 12 THEN
        RAISE EXCEPTION 'POST-CHECK FAILED: Profiles count altered: % (expected 12)', v_profiles_after;
    END IF;

    SELECT COUNT(*) INTO v_settings_after FROM public.platform_settings;
    IF v_settings_after <> 1 THEN
        RAISE EXCEPTION 'POST-CHECK FAILED: Platform settings count altered: % (expected 1)', v_settings_after;
    END IF;


    -- ========================================================================
    -- 4. INSERT REAL CAPTURED COUNTS INTO DYNAMIC REPORT TABLE
    -- ========================================================================
    INSERT INTO cleanup_report VALUES
        ('orders', v_orders_before, v_orders_deleted, v_orders_after, 46, 0, 'PASS - EXACT MATCH'),
        ('notifications (order-linked)', v_notifs_before, v_notifs_deleted, v_notifs_after, 287, 1, 'PASS - EXACT MATCH'),
        ('audit_logs (order-linked)', v_audits_before, v_audits_deleted, v_audits_after, 47, 82, 'PASS - EXACT MATCH'),
        ('caterer_registrations', v_caterers_before, 0, v_caterers_after, 0, 2, 'PASS - PRESERVED'),
        ('profiles', v_profiles_before, 0, v_profiles_after, 0, 12, 'PASS - PRESERVED'),
        ('platform_settings', v_settings_before, 0, v_settings_after, 0, 1, 'PASS - PRESERVED');

    RAISE NOTICE '>>> ALL PRE-CHECKS, DELETION ASSERTIONS, AND POST-CHECKS PASSED.';
    RAISE NOTICE '>>> Captured Deleted: orders=%, notifications=%, audit_logs=%', 
        v_orders_deleted, v_notifs_deleted, v_audits_deleted;
END $$;

-- ============================================================================
-- 5. DYNAMIC VERIFICATION REPORT (PULLS CAPTURED VARIABLES FROM TEMP TABLE)
-- ============================================================================
SELECT 
    entity,
    count_before,
    actual_deleted,
    count_after,
    expected_deleted,
    expected_remaining,
    status
FROM cleanup_report;

-- 5B. Confirm surviving partner notification content
SELECT 
    id, 
    title, 
    "orderId", 
    created_at, 
    'PRESERVED PARTNER REGISTRATION' AS verification_status
FROM public.notifications;

-- ============================================================================
-- 6. TRANSACTION ROLLBACK (SAFETY GUARD)
-- ============================================================================
-- DRY RUN: Default is ROLLBACK. No database changes are committed.
-- To execute permanently after inspecting the report, change ROLLBACK; to COMMIT;
ROLLBACK;
