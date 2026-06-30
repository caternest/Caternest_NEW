const fs = require('fs');
const file = './src/pages/Orders.tsx';
let content = fs.readFileSync(file, 'utf8');

// We want to replace the sequence starting from line 1340's divs to line 1350
const targetSeq = `                                  </div>
                               </div>
                            </div>
                               </div>
                            </div>
                         );
                      })}
                   </div>
                )}
             </div>
          )}`;

const replacement = `                                  </div>
                               </div>
                            ))}
                         </div>
                      )}
                   </div>
                )}`;

if (content.indexOf(targetSeq) === -1) {
    // Let's try matching with different spacing/indents
    console.log("Direct match not found. Trying flexible regex...");
    const regex = /<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*\);\s*\}\)\}\s*<\/div>\s*\)\}\s*<\/div>\s*\)\}/;
    if (regex.test(content)) {
        content = content.replace(regex, `</div>\n                               </div>\n                            ))}\n                         </div>\n                      )}\n                   </div>\n                )}`);
        fs.writeFileSync(file, content, 'utf8');
        console.log("Regex replacement succeeded!");
    } else {
        console.error("Could not find the target block with regex either.");
        process.exit(1);
    }
} else {
    content = content.replace(targetSeq, replacement);
    fs.writeFileSync(file, content, 'utf8');
    console.log("Direct replacement succeeded!");
}
