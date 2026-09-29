const { exec } = require('child_process');

exec('cd client && pnpm run preview', (err) => {
   if (err) console.error(err);
});

setTimeout(() => {
   exec('npx tsx scripts/generate-preview.ts', (err, stdout, stderr) => {
       console.log(stdout);
       console.log(stderr);
       exec('kill $(lsof -t -i :4173)');
   });
}, 5000);
