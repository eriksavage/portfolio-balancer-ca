"use strict";
import { confirm, input, select } from '@inquirer/prompts';
import { JsonPersistence } from './jsonPersistence.js';
import { Portfolio } from './models/portfolio.js';
import { Asset } from './models/asset.js';

const fill = "####################"
console.log(`${fill} PORTFOLIO BALANCER ${fill}`);
let portfolios = await JsonPersistence.read();
portfolios[0]?.calculateAssetPortfolioPercentages();
let exit = false;

while (exit != true) {
  let selection = await mainMenu();

  switch (selection) {
    case "exit":
      exit = true;
      break;
    case "view":
      const portfolio = await viewPortfoliosMenu(portfolios);
      renderAssets(portfolio.assets);
      const action = await portfolioMenu()
      if (action === "dca") await dollarCostAverage(portfolio);
      break;
    case "update":
      console.log(`You have selected: ${selection}`);
      break;
    case "create":
      await createPortfolio();
      break;
    default:
      exit = true;
  }
}

async function mainMenu() {
  return await select({
    message: 'Select an action',
    choices: [
      {
        name: 'View Portfolio',
        value: 'view',
        description: 'View an existing portfolio.',
      },
      {
        name: 'Update Portfolio',
        value: 'update',
        description: 'Update an existing portfolio.',
      },
      {
        name: 'Create Portfolio',
        value: 'create',
        description: 'Create a new portfolio.',
      },
      {
        name: 'Exit',
        value: 'exit',
        description: 'Exit the portfolio balancer.',
      }
    ],
  });
}

async function viewPortfoliosMenu(portfolios) {
  if (portfolios?.length > 0) {
    let choices = portfolios.map(p => {
      return {
        name: p.name,
        value: p.name,
        description: p.description,
      }
    })

    const selectedPortfolio = await select({
      message: 'Select a portfolio to view.',
      choices: choices,
    });

    return portfolios.find(p => p.name === selectedPortfolio);
  }

  console.log("No portfolios availble to view, please select Create Portfolio.");
}

async function portfolioMenu() {
  return await select({
    message: 'Select an action',
    choices: [
      {
        name: 'DCA',
        value: 'dca',
        description: 'Dollar Cost Average into Portfolio.',
      },
      {
        name: 'Main Menu',
        value: 'main',
        description: 'Return to Main Menu.',
      }
    ],
  });
}

function renderAssets(assets) {
  const assetsTable = assets.map(a => {
    return {
      'TICKER': a.stockTicker,
      'SHARES': a.sharesOwned,
      'PRICE': a.currentSharePrice,
      'VALUE': a.sharesOwned * a.currentSharePrice,
      '% ACT': a.portfolioPercentage,
      '% DES': a.desiredPercentage
    }
  });

  console.table(assetsTable);
}

async function createPortfolio() {
  const name = (await input({ message: 'Enter portfolio name:' })).trim();
  let description = (await input({ message: 'Enter portfolio description:' })).trim();
  description = description ? description : name;

  const portfolio = new Portfolio(name, description);

  const numberOfAssets = (await input({ message: 'Enter number of assets:' })).trim();

  for (let i = 1; i <= numberOfAssets; i++) {
    console.log(`Enter details for asset ${i}`)
    portfolio.addAsset(await createAsset());
  }
  portfolio.calculateAssetPortfolioPercentages();
  portfolios.push(portfolio);
  JsonPersistence.save(portfolios);
}

async function createAsset() {
  const stockTicker = await input({ message: 'Enter stock ticker:' });
  const desiredPercentage = await input({ message: 'Enter desired portfolio percentage:' });
  const sharesOwned = await input({ message: 'Enter shares owned:' });
  const currentSharePrice = await input({ message: 'Enter current share price:' });

  return new Asset(stockTicker, desiredPercentage, sharesOwned, currentSharePrice);
}

async function dollarCostAverage(portfolio) {
  //TODO: seperate out menu portion from dca calculation locgicce
  const dcaAmount = await input({ message: 'Enter dollar amount for Dollar Cost Averaging:' });

  const assets = portfolio.assets.map(async a => {
    let answer = await confirm({ message: `Confirm ${a.stockTicker} Shares Owned = ${a.sharesOwned}` });
    if (answer == false) a.sharesOwned = await input({ message: 'Enter shares owned:' });

    answer = await confirm({ message: `Confirm ${a.stockTicker} Current Share Price = ${a.currentSharePrice}` });
    if (answer == false) a.currentSharePrice = await input({ message: 'Enter current share price:' });
  })
  portfolio.assets = assets;

  calculateDCA(portfolio);

  return portfolio;
}

function calculateDCA(portfolio) {

}
