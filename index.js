const puppeteer = require('puppeteer');
const {google} = require('googleapis');
const keys = require('./keys.json');

(async () => {
    try {
        const browser = await puppeteer.launch({headless: false, defaultViewport: null, executablePath: '/usr/bin/chromium-browser'});
        const page = await browser.newPage();
        await page.goto('https://www.linkedin.com/feed/');
        await page.click('a.main__sign-in-link');
        await page.waitForSelector('input#password'); 
        await page.waitForTimeout(2000);

        // CONECTAR E PEGAR OS DADOS DA PLANILHA
        const client = new google.auth.JWT(
            keys.client_email,
            null,
            keys.private_key,
            ['https://www.googleapis.com/auth/spreadsheets']
        );
        
        let isAuthorized = await isClientAuthorized(client)

        // FAZER LOGIN
        let username = 'diego.castro@byintera.com';
        let password = 'interagrowth34dc';

        await login(username, password, page);
        
        //EXECUTAR O SCRIPT CASO A CONEXÃO COM O BANCO DE DADOS SEJA BEM SUCEDIDA
        if (isAuthorized) {
            // COLETAR OS DADOS DA PLANILHA
            let dataSheets = await getDataFromSheets(client);
            console.log('DataArray: ', dataSheets)
            // EXECUTAR O SCRIPT COM OS DADOS COLETADOS
            let finalUrls = await script(page, dataSheets, browser)
            await updateDataToSheets(client, finalUrls)
        }
        
        console.log('finished')

        
    } catch (e) {
        console.log(e);
    }
})();

async function login(username, password, page) {
    let usernameInput = 'input#username'
    let passwordInput = 'input#password'
    

    await page.type(usernameInput, username, {delay: 200}) 
    await page.type(passwordInput, password, {delay: 200}) 

    let loginButton = await page.$('button.btn__primary--large');
    await loginButton.click()
    await page.waitForSelector('.global-nav__logo')

}

async function isClientAuthorized(client) {
    try {
        await client.authorize()
        console.log('Connected')
        return true;

    } catch (e) {
        console.log(e)
        console.log('Woops! Something went wrong')
        return false;
    }
}

async function getDataFromSheets(client){
    console.log('GS Runned')
    const gsapi = google.sheets({version: 'v4', auth: client})

    const opt = {
        spreadsheetId: '1H-gjwhdOJ8KEX4HJDHQCv_4BePXEPP-cHubNqaMwR8s',
        range: 'Data!A1:B5' // Área de execução
    }

    let data = await gsapi.spreadsheets.values.get(opt);

    let dataArray = data.data.values;
    
    return dataArray
}

async function executeScript (page, sheetsData) {
    console.log(sheetsData)
    if (sheetsData) {
        let finalUrls = []
        for (row of sheetsData) {
            if (row[0]){
                await page.goto(row[0]);
                linkedinFinalUrls.push([await page.url()])
            }
        }
        console.log(finalUrls)
        return finalUrls
    }
}

async function updateDataToSheets(client, data) {
    const gsapi = google.sheets({version:'v4', auth: client})

    const updateOptions = {
        spreadsheetId: '1H-gjwhdOJ8KEX4HJDHQCv_4BePXEPP-cHubNqaMwR8s',
        range: 'Data!C1',
        valueInputOption: 'USER_ENTERED',
        resource: {
            values: data
        }
    }
    let response = await gsapi.spreadsheets.values.update(updateOptions);
    console.log(response.status)
}

async function script(page, data, browser) {
    let finalUrls = []
    // DATA => ARRAY DE ARRAYS => [ROW[COLUM]]
    for (row of data) {
        if (row[0]){
            console.log(row[0])
            await page.goto(row[0])
            let anunciarVagaNovamenteButton = "button[data-control-name = 'hiring_job_repost']";
            await page.waitForSelector(anunciarVagaNovamenteButton,{timeout: 60000});
            await page.waitForTimeout(3000);
            await page.evaluate(() => {
                document.querySelector("button[data-control-name = 'hiring_job_repost']").click()
            })
            // await page.click(anunciarVagaNovamenteButton);

            await page.waitForTimeout(3000);
        
            let newPages = await browser.pages();
            
            let talentSolutionsPage = await newPages[2];
            await talentSolutionsPage.waitForSelector('button.wow-page-online__submit-button');
            await talentSolutionsPage.click('button.wow-page-online__submit-button')
            
            let competenciasListSelector = ".job-skill-typeahead ul li[data-test-job-skill-pill-dismiss]";
        
            await talentSolutionsPage.waitForSelector(competenciasListSelector);
            let competenciasLabels = await talentSolutionsPage.$$(competenciasListSelector)
            for (let i = 0; i < competenciasLabels.length ; i++ ) {
                await talentSolutionsPage.click(competenciasListSelector)
                await talentSolutionsPage.waitForTimeout(1000)
            }
        
            let competenciasInputSelector = ".job-skill-typeahead ul li[data-test-job-skill-pill-input]";
        
            // Change to get the list of googlesheets in JSON for preference
            keyWords = row[1].split(',')
            for (keyWord of keyWords) {
                await talentSolutionsPage.click(competenciasInputSelector);
                await talentSolutionsPage.type(competenciasInputSelector, keyWord, {delay: 200});
                await talentSolutionsPage.waitForTimeout(3000);
                await talentSolutionsPage.keyboard.press('ArrowDown');
                await talentSolutionsPage.waitForTimeout(1000);
                await talentSolutionsPage.keyboard.press('Enter');
                await talentSolutionsPage.waitForTimeout(1000);
            }
        
            // Click em continuar Page 01
            let continueButton = await talentSolutionsPage.$('button[data-live-test-online-description-continue]');
            await continueButton.click();
            
            // Copiar o endereço do site
            let continueButtonSecondPageSelector = 'button[data-live-test-online-assessments-continue="continue"]'
            await talentSolutionsPage.waitForSelector(continueButtonSecondPageSelector)
            let enderecoElementValue = await talentSolutionsPage.evaluate(() => {
                let enderecoElementValue = document.querySelector("input[name='online-apply-method-value']").value
                
                return enderecoElementValue;
            })
        
        
        
            // REGISTRAR O VALOR NO EXCEL
                finalUrls.push([enderecoElementValue])
                // Printar valor do Endereço
                console.log(enderecoElementValue)
        
        
            // Click em continuar Page 02
            await talentSolutionsPage.click(continueButtonSecondPageSelector)
        
            let backbutton = 'button[data-control-name="back"]'
        
            await talentSolutionsPage.waitForSelector('button[data-live-test-online-budget-promote]')
        
            for (let i = 0; i<2; i++) {
                await talentSolutionsPage.waitForSelector(backbutton)
                await talentSolutionsPage.click(backbutton)
                await talentSolutionsPage.waitForTimeout(1000)
            }

            await talentSolutionsPage.close()

            
        }
    }
    return finalUrls
}