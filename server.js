const Telegraf = require("telegraf");
const fetch = require('node-fetch');
const mongoose = require("mongoose");
const Log = require("./log");


var cse = process.env.GOOGLE_CSE_ID;
var googleApi = process.env.GOOGLE_SEARCH_API;
var telegramApi = process.env.LYRICS_API_TOKEN;
var dbUrl = process.env.DATABASE_URL;

mongoose.connect(dbUrl);

const bot = new Telegraf(telegramApi);

bot.use((ctx, next) => {
    const start = new Date()
    return next(ctx).then(() => {
      const ms = new Date() - start
      var newLog = new Log({
        date: new Date(),
        query: ctx.message,
      });
      newLog.save();
      console.log('Response time %sms', ms)
    });
});

bot.start((ctx) => ctx.reply('Welcome to ET Lyrics Bot! Search lyrics by using the artist\'s name and the song\'s title!'));
bot.help((ctx) => ctx.reply('Search lyrics by using the artist\'s name and the song\'s title!'));

bot.on('text', (ctx) => {
    getLyrics(ctx);
});

bot.startPolling()

var getLyrics = (ctx) => {
    var query = ctx.message.text.trim().split(" ");
    var req_url = `https://www.googleapis.com/customsearch/v1?q=[${query}]&cx=${cse}&num=10&key=${googleApi}&alt=json`;
    fetch(req_url)
        .then(res => res.json())
        .then(json => { 
            var res_url = json.items[0].link;
            fetch(res_url)
                .then(res => res.text())
                .then(body => {
                    var lyrics = body;
                    var singer = lyrics.split("<h2><b>")[1]
                    singer = singer.split("Lyrics</b></h2>")[0]
                    var title = lyrics.split("<b>")[2]
                    title = title.split("</b>")[0]+"\n"
                    var up_partition = '<!-- Usage of azlyrics.com content by any third-party lyrics provider is prohibited by our licensing agreement. Sorry about that. -->'
                    var down_partition = '<!-- MxM banner -->'
                    lyrics = singer + " - " + title + lyrics.split(up_partition)[1]
                    lyrics = lyrics.split(down_partition)[0]
                    lyrics = lyrics.replace(/<br\/>/gi, '').replace(/<br>/gi, '').replace(/<\/br>/gi, '')
                                    .replace(/<i>/gi, '').replace(/<\/i>/gi, '').replace(/<\/div>/gi, '').trim()
                    ctx.reply(lyrics);
                }).catch(err => {ctx.reply(err.message)});
        }).catch(err => {ctx.reply(err.message)});
}