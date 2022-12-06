# g-team
G-Team: 주식앱(웹)
Please make sure to install node.js beforehand.<br>
npm install -g npm
1. Download(Clone) the GitHub files 
2. Open powershell and use 'cd' to go to the directory where the files are 
3. Enter the following lines: <br>

npm i -g typescript <br>
npm i express @types/express express-session@types/express-session <br>
npm i -D ts-node nodemon <br>
tsc --init <br>
npm i ejs <br>
npm i sqlite3 <br>

4. if 'tsc --init' doesn't work, try 'npx tsc --init' 
5. Enter the following lines on powershell: <br>
nodemon --watch '*.ts' --exec 'ts-node' index.ts

localhost:8080
