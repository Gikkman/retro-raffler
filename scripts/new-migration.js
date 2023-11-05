/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');

const name = process.argv[2];
if(!name) {
  console.error('You need to pass a name for the migration file');
  return;
}
if(process.argv[3]) {
  console.error('The name of the migration file cannot contain spaces');
  return;
}
if(!name.match(/[\w-]+/)) {
  console.error('The name should only contain letters, numbers, underscores and/or dashes');
  return;

}
const now = new Date().getTime();
const fileName = now + "-" + name.toLowerCase() + ".sql";
const contentTemplate =`
--------------------------------------------------
-- Up
--------------------------------------------------

CREATE TABLE 'temp';

--------------------------------------------------
-- Down
--------------------------------------------------

DROP TABLE 'temp';

`;
try {
  console.info("Creating new migration file " + fileName);
  fs.writeFileSync(path.join(__dirname, "..", "project", "migrations", fileName), contentTemplate);
  console.info("New migration file created");
}
catch(err) {
  console.error("Error creating migration file");
  console.error(err);
}
