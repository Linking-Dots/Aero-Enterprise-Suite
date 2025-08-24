#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// Enhanced component mappings with conversion strategies
const CONVERSION_STRATEGIES = {
  // Strategy 1: Simple Select components (for filters and forms)
  simpleSelect: {
    pattern: /<Select[\s\S]*?<\/Select>/g,
    convert: (match) => {
      // Extract props
      const labelMatch = match.match(/label="([^"]*)"/);
      const selectedKeysMatch = match.match(/selectedKeys=\{([^}]*)\}/);
      const onSelectionChangeMatch = match.match(/onSelectionChange=\{([^}]*)\}/);
      
      const label = labelMatch ? labelMatch[1] : '';
      
      // Extract SelectItems
      const selectItemPattern = /<SelectItem[^>]*key="([^"]*)"[^>]*(?:value="([^"]*)")?[^>]*>([^<]*)<\/SelectItem>/g;
      let selectItemMatches = [];
      let itemMatch;
      while ((itemMatch = selectItemPattern.exec(match)) !== null) {
        selectItemMatches.push({
          key: itemMatch[1],
          value: itemMatch[2] || itemMatch[1],
          text: itemMatch[3]
        });
      }
      
      // Generate Material UI Select
      let muiSelect = `<FormControl fullWidth size="small">\n`;
      if (label) {
        muiSelect += `  <InputLabel>{${label}}</InputLabel>\n`;
      }
      muiSelect += `  <Select\n`;
      if (selectedKeysMatch) {
        muiSelect += `    value={${selectedKeysMatch[1]}}\n`;
      }
      if (onSelectionChangeMatch) {
        muiSelect += `    onChange={${onSelectionChangeMatch[1]}}\n`;
      }
      muiSelect += `    sx={{\n`;
      muiSelect += `      backgroundColor: 'rgba(255, 255, 255, 0.05)',\n`;
      muiSelect += `      backdropFilter: 'blur(10px)',\n`;
      muiSelect += `      borderRadius: '12px',\n`;
      muiSelect += `      color: 'white',\n`;
      muiSelect += `      '& .MuiOutlinedInput-notchedOutline': {\n`;
      muiSelect += `        borderColor: 'rgba(255, 255, 255, 0.2)',\n`;
      muiSelect += `      },\n`;
      muiSelect += `      '&:hover .MuiOutlinedInput-notchedOutline': {\n`;
      muiSelect += `        borderColor: 'rgba(255, 255, 255, 0.3)',\n`;
      muiSelect += `      },\n`;
      muiSelect += `      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {\n`;
      muiSelect += `        borderColor: 'var(--primary-color)',\n`;
      muiSelect += `      },\n`;
      muiSelect += `    }}\n`;
      muiSelect += `  >\n`;
      
      // Add MenuItems
      selectItemMatches.forEach(item => {
        muiSelect += `    <MenuItem value="${item.value}">${item.text}</MenuItem>\n`;
      });
      
      muiSelect += `  </Select>\n`;
      muiSelect += `</FormControl>`;
      
      return muiSelect;
    }
  },

  // Strategy 2: Dropdown menus (action menus)
  dropdown: {
    pattern: /<Dropdown[\s\S]*?<\/Dropdown>/g,
    convert: (match) => {
      // This requires state management for anchors
      // For now, return a placeholder that needs manual conversion
      return `{/* TODO: Convert Dropdown to Material UI Menu - requires anchor state */}\n${match}`;
    }
  }
};

// Find all JSX files that need conversion
async function findFilesWithHeroUIComponents() {
  const files = await glob('resources/js/**/*.jsx', { cwd: process.cwd() });
  const results = [];
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    
    // Check for HeroUI Select/Dropdown imports
    if (content.includes('Select') || content.includes('Dropdown')) {
      const hasHeroUIImport = /from ['"]@heroui\/react['"]/.test(content);
      if (hasHeroUIImport) {
        results.push(file);
      }
    }
  }
  
  return results;
}

// Generate report of what needs to be converted
async function generateConversionReport() {
  console.log('🔍 Analyzing HeroUI component usage...\n');
  
  const files = await findFilesWithHeroUIComponents();
  
  if (files.length === 0) {
    console.log('✅ No files with HeroUI Select/Dropdown components found!\n');
    return;
  }
  
  console.log(`📊 Found ${files.length} files with HeroUI components:\n`);
  
  const componentStats = {
    Select: 0,
    SelectItem: 0,
    Dropdown: 0,
    DropdownTrigger: 0,
    DropdownMenu: 0,
    DropdownItem: 0
  };
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    console.log(`📄 ${file}`);
    
    // Count each component type
    Object.keys(componentStats).forEach(component => {
      const regex = new RegExp(`<${component}[\\s>]`, 'g');
      const matches = content.match(regex) || [];
      const count = matches.length;
      if (count > 0) {
        console.log(`   🔸 ${component}: ${count} instances`);
        componentStats[component] += count;
      }
    });
    
    console.log('');
  });
  
  console.log('📈 TOTAL COMPONENT COUNTS:');
  Object.entries(componentStats).forEach(([component, count]) => {
    if (count > 0) {
      console.log(`   ${component}: ${count} instances`);
    }
  });
  
  console.log('\n💡 CONVERSION REQUIREMENTS:');
  console.log('   Select → FormControl + InputLabel + Select + MenuItem (Material UI)');
  console.log('   SelectItem → MenuItem (Material UI)');
  console.log('   Dropdown → Menu + IconButton (Material UI) + anchor state');
  console.log('   DropdownTrigger → IconButton (Material UI)');
  console.log('   DropdownMenu → Menu (Material UI)');
  console.log('   DropdownItem → MenuItem (Material UI)');
  
  console.log('\n📝 FILES REQUIRING MANUAL CONVERSION:');
  files.forEach(file => {
    console.log(`   ⚠️  ${file} - Complex component structure needs manual conversion`);
  });
  
  console.log('\n🔧 RECOMMENDED APPROACH:');
  console.log('   1. Start with simple Select components (filters, forms)');
  console.log('   2. Convert Dropdown components (require anchor state management)');
  console.log('   3. Update imports to remove HeroUI components and add Material UI components');
  console.log('   4. Test each converted component for functionality');
  console.log('   5. Apply consistent glassy styling with Material UI sx prop');
}

// Main execution
(async () => {
  try {
    await generateConversionReport();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();

export { generateConversionReport };
