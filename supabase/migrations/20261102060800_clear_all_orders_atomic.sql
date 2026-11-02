-- ========================================================================
-- MIGRATION: 20261102060800_clear_all_orders_atomic.sql
-- DESCRIPTION: Atomic transaction RPC for PlanMyChoice order history cleanup
-- ========================================================================
-- Guarantees:
-- 1. SECURITY DEFINER with fixed search_path = pg_catalog, public, pg_temp.
-- 2. Fully schema-qualified table references.
-- 3. Execution REVOKED from PUBLIC, anon, and authenticated roles.
-- 4. Execution GRANTED EXCLUSIVELY to service_role.
-- 5. Exact conjunction notification targeting with 'New Partner Registration 🏢' preserved.
-- 6. Exact audit log targeting with 4 approved order actions; 12 admin actions preserved.
-- 7. Pre-deletion count guards (46 orders, 287 notifications, 47 audit logs).
-- 8. Concurrency table locks in SHARE ROW EXCLUSIVE MODE.
-- 9. Atomic rollback on any failure.
-- ========================================================================

CREATE OR REPLACE FUNCTION public.clear_all_orders_atomic(
    p_admin_email TEXT,
    p_backup_file_name TEXT,
    p_expected_orders INT,
    p_expected_notifications INT,
    p_expected_audits INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
    v_order_count INT := 0;
    v_notif_target_count INT := 0;
    v_audit_target_count INT := 0;
    v_deleted_notif_count INT := 0;
    v_deleted_audit_count INT := 0;
BEGIN
    -- Guard: Validate required parameters
    IF p_expected_orders IS NULL OR p_expected_notifications IS NULL OR p_expected_audits IS NULL THEN
        RAISE EXCEPTION 'All expected count parameters (p_expected_orders, p_expected_notifications, p_expected_audits) must be provided.';
    END IF;

    -- Concurrency Guard: Lock targeted tables in SHARE ROW EXCLUSIVE MODE.
    -- Allows concurrent SELECT queries across the website to continue without interruption,
    -- while blocking concurrent INSERT/UPDATE/DELETE on these 3 tables during this sub-second transaction.
    -- Eliminates race conditions and count drift between pre-deletion count guards and DELETE execution.
    LOCK TABLE public.orders, public.notifications, public.audit_logs IN SHARE ROW EXCLUSIVE MODE;

    -- 1. Count live orders and verify against expected count guard
    SELECT COUNT(*) INTO v_order_count FROM public.orders;
    IF v_order_count <> p_expected_orders THEN
        RAISE EXCEPTION 'Target order count mismatch: expected %, found % in database. Aborting cleanup without modifying data.', p_expected_orders, v_order_count;
    END IF;

    -- 2. Count targeted notifications using exact verified conjunction
    -- Requires BOTH a non-empty trimmed orderId AND a verified order-lifecycle event title
    SELECT COUNT(*) INTO v_notif_target_count
    FROM public.notifications
    WHERE "orderId" IS NOT NULL
      AND TRIM("orderId") <> ''
      AND title IN (
          'New Order Received 🧑‍🍳',
          'Event Completed 🎉',
          'Order Approved',
          'Order Status Adjusted by Admin',
          'Order Approved! 🎉',
          'New Booking Submitted 📨',
          'New Order Created 🔔',
          'Order Force Updated',
          'Details Requested'
      )
      AND title NOT IN ('New Partner Registration 🏢');

    -- Expected count guard for notifications
    IF v_notif_target_count <> p_expected_notifications THEN
        RAISE EXCEPTION 'Target notification count mismatch: expected %, found % in database. Aborting cleanup without modifying data.', p_expected_notifications, v_notif_target_count;
    END IF;

    -- 3. Count targeted audit records using exact verified action + details combinations
    -- Strictly covers the 4 approved order actions (47 records total); excludes all admin actions
    SELECT COUNT(*) INTO v_audit_target_count
    FROM public.audit_logs
    WHERE (
        (action = 'Force status: Approved' AND details ILIKE 'User action on entity: Order #%')
        OR (action = 'Order approved' AND details ILIKE 'Order %: Order approved by %')
        OR (action = 'Order changes requested' AND details ILIKE 'Order %: Order changes requested by %')
        OR (action = 'Order Deleted' AND (details ILIKE 'Admin permanently deleted order #%' OR details ILIKE 'User action on entity: Order #%'))
    )
    AND action NOT IN (
        'Update Platform Settings',
        'Moved to Trash',
        'Permanently Deleted',
        'badge removed',
        'badge edited',
        'badge activated',
        'badge assigned',
        'badge deactivated',
        'Badge Created',
        'Approve Profile Update',
        'Reject Profile Update',
        'test_action'
    );

    -- Expected count guard for audit logs
    IF v_audit_target_count <> p_expected_audits THEN
        RAISE EXCEPTION 'Target audit log count mismatch: expected %, found % in database. Aborting cleanup without modifying data.', p_expected_audits, v_audit_target_count;
    END IF;

    -- 4. Delete verified order-specific notifications
    WITH deleted_notifs AS (
        DELETE FROM public.notifications
        WHERE "orderId" IS NOT NULL
          AND TRIM("orderId") <> ''
          AND title IN (
              'New Order Received 🧑‍🍳',
              'Event Completed 🎉',
              'Order Approved',
              'Order Status Adjusted by Admin',
              'Order Approved! 🎉',
              'New Booking Submitted 📨',
              'New Order Created 🔔',
              'Order Force Updated',
              'Details Requested'
          )
          AND title NOT IN ('New Partner Registration 🏢')
        RETURNING id
    )
    SELECT COUNT(*) INTO v_deleted_notif_count FROM deleted_notifs;

    -- 5. Delete exact verified order-specific audit records only
    WITH deleted_audits AS (
        DELETE FROM public.audit_logs
        WHERE (
            (action = 'Force status: Approved' AND details ILIKE 'User action on entity: Order #%')
            OR (action = 'Order approved' AND details ILIKE 'Order %: Order approved by %')
            OR (action = 'Order changes requested' AND details ILIKE 'Order %: Order changes requested by %')
            OR (action = 'Order Deleted' AND (details ILIKE 'Admin permanently deleted order #%' OR details ILIKE 'User action on entity: Order #%'))
        )
        AND action NOT IN (
            'Update Platform Settings',
            'Moved to Trash',
            'Permanently Deleted',
            'badge removed',
            'badge edited',
            'badge activated',
            'badge assigned',
            'badge deactivated',
            'Badge Created',
            'Approve Profile Update',
            'Reject Profile Update',
            'test_action'
        )
        RETURNING id
    )
    SELECT COUNT(*) INTO v_deleted_audit_count FROM deleted_audits;

    -- 6. Delete all orders from public.orders
    DELETE FROM public.orders;

    -- 7. Record final administrative audit record matching exact production schema
    INSERT INTO public.audit_logs (
        timestamp,
        action,
        details,
        user_email,
        role
    )
    VALUES (
        to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
        'Clear All Orders',
        format('Admin purged %s orders, %s linked notifications, and %s audit logs. Durable backup snapshot: %s', v_order_count, v_deleted_notif_count, v_deleted_audit_count, p_backup_file_name),
        COALESCE(NULLIF(TRIM(p_admin_email), ''), 'admin'),
        'Admin'
    );

    -- 8. Return verified counts
    RETURN jsonb_build_object(
        'success', TRUE,
        'deleted_orders', v_order_count,
        'deleted_notifications', v_deleted_notif_count,
        'deleted_audit_logs', v_deleted_audit_count,
        'backup_file_name', p_backup_file_name,
        'timestamp', to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    );
END;
$$;

-- ========================================================================
-- SECURITY HARDENING: STRICT PRIVILEGE RESTRICTION
-- ========================================================================
-- Revoke execution from PUBLIC, anon, and authenticated client roles
REVOKE ALL ON FUNCTION public.clear_all_orders_atomic(TEXT, TEXT, INT, INT, INT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.clear_all_orders_atomic(TEXT, TEXT, INT, INT, INT) FROM anon;
REVOKE ALL ON FUNCTION public.clear_all_orders_atomic(TEXT, TEXT, INT, INT, INT) FROM authenticated;

-- Grant execution privilege EXCLUSIVELY to the trusted service_role
GRANT EXECUTE ON FUNCTION public.clear_all_orders_atomic(TEXT, TEXT, INT, INT, INT) TO service_role;
