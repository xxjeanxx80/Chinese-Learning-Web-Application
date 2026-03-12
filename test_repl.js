const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.css')) results.push(file);
        }
    });
    return results;
}

const files = walk('./src');
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let dirty = false;
    
    // Replace linear gradients with var(--accent-primary)
    const regexGradient1 = /linear-gradient\(135deg,\s*(var\(--accent-primary,?\s*#667eea\)|#667eea)\s*0%,\s*(var\(--accent-secondary,?\s*#764ba2\)|#764ba2)\s*100%\)/g;
    if (regexGradient1.test(content)) {
        content = content.replace(regexGradient1, 'var(--accent-primary)');
        dirty = true;
    }
    
    const regexGradient2 = /linear-gradient\(135deg,\s*#667eea\s*0%,\s*#764ba2\s*100%\)/g;
    if (regexGradient2.test(content)) {
        content = content.replace(regexGradient2, 'var(--accent-primary)');
        dirty = true;
    }

    // Replace hardcoded #667eea with var(--accent-primary)
    if (content.includes('#667eea') && !content.includes('var(--accent-primary, #667eea)')) {
        content = content.replace(/#667eea/g, 'var(--accent-primary)');
        dirty = true;
    }
    
    // Add backdrop-filter to buttons that just have bg-card or border solid
    /* It's safer to just replace standard components */

    if (dirty) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Updated ' + file);
    }
});
