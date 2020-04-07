const axios = require('axios');
const cheerio = require('cheerio');
const winston = require('winston');
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

(async () => {
  const response = await httpClient.get('https://dota2.gamepedia.com/Hero_Grid');
  logger.info('page loaded');

  const $ = cheerio.load(response.data);
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
    logger.info(`Logged in as ${discordClient.user.tag}!`);
  });

  discordClient.on('message', msg => {
    if (msg.content === '!random') {
      const hero = heroes[Math.floor(Math.random() * heroes.length)];
      msg.reply(hero.name, {files: [hero.picture]});
    }
  });

  discordClient.login(token);
})();

