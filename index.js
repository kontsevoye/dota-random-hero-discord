const axios = require('axios');
const cheerio = require('cheerio');
const winston = require('winston');
const express = require('express');
const httpApp = express();
const Discord = require('discord.js');
const discordClient = new Discord.Client();
const httpClient = axios.create({
  timeout: 5000,
});
const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(),
  ]
});
const token = process.env.DISCORD_TOKEN;
const httpPort = process.env.PORT || 8080;

(async () => {
  let responseData;
  try {
    const response = await httpClient.get('https://dota2.gamepedia.com/Hero_Grid');
    responseData = response.data;
    logger.info('dota wiki page loaded');
  } catch (e) {
    logger.error('error while dota wiki page fetch');
    process.exit(1);
  }

  const $ = cheerio.load(responseData);
  const heroEntries = $('.heroentry');
  const heroes = heroEntries.map((i, entry) => {
    const name = $(entry).text();
    const srcSet = $(entry).find('img').first().attr('srcset');
    const pictures = srcSet.split(' ').filter(str => str.startsWith('http'));
    const picture = pictures[pictures.length - 1];

    return {name, picture};
  });

  logger.info(`loaded ${heroes.length} heroes`);
  if (heroes.length < 119) {
      logger.error('something wrong with response');
      process.exit(1);
  }

  discordClient.on('ready', () => {
    logger.info(`logged in as ${discordClient.user.tag}`);
  });

  discordClient.on('message', msg => {
    if (msg.content === '!random') {
      const hero = heroes[Math.floor(Math.random() * heroes.length)];
      msg.reply(hero.name, {files: [hero.picture]});
    }
  });

  try {
    await discordClient.login(token);
  } catch (e) {
    logger.error(e.message);
    process.exit(1);
  }

  httpApp.get('/', (req, res) => {
    res.send('Hello Heroku!');
  });

  httpApp.listen(httpPort, () => {
    logger.info(`http app listening on port ${httpPort}`);
  });
})();

