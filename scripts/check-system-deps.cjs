const { execSync } = require('child_process');
const os = require('os');

console.log('\n🔍 Checking system dependencies...\n');

const isWindows = os.platform() === 'win32';

const dependencies = [
  {
    name: 'Pandoc',
    command: 'pandoc --version',
    required: true,
    purpose: 'DOCX file preview',
    installUrl: 'https://pandoc.org/installing.html'
  },
  {
    name: 'LibreOffice',
    command: isWindows 
      ? '"C:\\Program Files\\LibreOffice\\program\\soffice.exe" --version'
      : 'soffice --version',
    required: true,
    purpose: 'PowerPoint (PPTX) file preview',
    installUrl: 'https://www.libreoffice.org/download/download/'
  },
  {
    name: 'Poppler Utils',
    command: 'pdfinfo -v',
    required: true,
    purpose: 'PDF operations and conversions',
    installUrl: isWindows
      ? 'https://github.com/oschwartz10612/poppler-windows/releases/'
      : 'https://poppler.freedesktop.org/'
  }
];

let allPassed = true;
let missingDeps = [];

dependencies.forEach(dep => {
  try {
    execSync(dep.command, { stdio: 'ignore', shell: true });
    console.log(`✅ ${dep.name} - Installed`);
  } catch (error) {
    allPassed = false;
    missingDeps.push(dep);
    console.log(`❌ ${dep.name} - NOT FOUND`);
    console.log(`   Purpose: ${dep.purpose}`);
    console.log(`   Install: ${dep.installUrl}\n`);
  }
});

if (allPassed) {
  console.log('\n✅ All system dependencies are installed!\n');
  process.exit(0);
} else {
  console.log('\n⚠️  Missing dependencies:', missingDeps.map(d => d.name).join(', '));
  console.log('   Please install them before running the application.\n');
  console.log('   See README.md for detailed installation instructions.\n');
  
  // Don't fail npm install, just warn
  process.exit(0);
}
