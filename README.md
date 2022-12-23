# g-team
G-Team: 주식앱(웹)
Please make sure to install node.js beforehand.<br>

1. Download(Clone) the GitHub files 
2. On Powershell, head to the directory for g-team files using 'cd' command
3. To install all the required node_modules for this project, enter the following on the Powershell <br>
npm install
4. Enter the following on Powershell to test the website <br>
npx nodemon --watch '*.ts' --exec 'ts-node' index.ts
5. Enter the following on the web browser <br>
localhost:8080 

Note:
npm i -g typescript
npm i express @types/express express-session@types/express-session
npm i -D ts-node nodemon
tsc --init
npm i ejs

[보안오류시]
Powershell 관리자 모드로 실행, 하단 명령어 입력후 YES선택, 
설정후 향후 보안이 취약해질 수 있으니 N으로 다시 설정 권장

set-executionpolicy remotesigned  

[프로그램실행]
npx nodemon --watch "*.ts" --exec "ts-node" index.ts
