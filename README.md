# How to Prepare Your Enviroment

## Install Packeges

>First of all, be sure you have the npm and node installed on your enviroment.

1. npm i puppeteer or "yarn add puppeteer"

    Note: When you install Puppeteer, it downloads a recent version of Chromium (~170MB Mac, ~282MB Linux, ~280MB Win) that is guaranteed to work with the API. To skip the download, or to download a different browser, see the documentation.

2. npm install googleapis@39 --save

## Final Adjustments

Find the variable `executablePath:` and change it to the path of Chromium on your computer.

Get the file of Keys from Googles Sheets API (or ask me)

Change the Range as you wish

## Execute

Just run `node index.js`
