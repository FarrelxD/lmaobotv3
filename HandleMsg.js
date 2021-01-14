require('dotenv').config()
const { decryptMedia } = require('@open-wa/wa-automate')

const moment = require('moment-timezone')
moment.tz.setDefault('Asia/Jakarta').locale('id')
const axios = require('axios')
const fetch = require('node-fetch')

const appRoot = require('app-root-path')
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const db_group = new FileSync(appRoot+'/lib/data/group.json')
const db = low(db_group)
db.defaults({ group: []}).write()
const { 
    removeBackgroundFromImageBase64
} = require('remove.bg')


const {
    exec
} = require('child_process')

const { 
    menuId, 
    cekResi, 
    urlShortener, 
    meme, 
    translate, 
    getLocationData,
    images,
    resep,
    rugapoi,
    rugaapi,
    cariKasar,
    truth,
    dare,
    tod
} = require('./lib')

const { 
    msgFilter, 
    color, 
    processTime, 
    isUrl,
	download
} = require('./utils')

const { uploadImages } = require('./utils/fetcher')

const fs = require('fs-extra')
const banned = JSON.parse(fs.readFileSync('./settings/banned.json'))
const simi = JSON.parse(fs.readFileSync('./settings/simi.json'))
const ngegas = JSON.parse(fs.readFileSync('./settings/ngegas.json'))
const setting = JSON.parse(fs.readFileSync('./settings/setting.json'))
const premiums = JSON.parse(fs.readFileSync('./settings/premiums.json'))
const adminbot = JSON.parse(fs.readFileSync('./settings/adminbot.json'))

let { 
    ownerNumber,
    adminNumber, 
    groupLimit, 
    memberLimit,
    prefix
} = setting

const {
    apiNoBg,
	apiSimi
} = JSON.parse(fs.readFileSync('./settings/api.json'))

function formatin(duit){
    let	reverse = duit.toString().split('').reverse().join('');
    let ribuan = reverse.match(/\d{1,3}/g);
    ribuan = ribuan.join('.').split('').reverse().join('');
    return ribuan;
}

const inArray = (needle, haystack) => {
    let length = haystack.length;
    for(let i = 0; i < length; i++) {
        if(haystack[i].id == needle) return i;
    }
    return false;
}

module.exports = HandleMsg = async (farrelxd, message) => {
    try {
        const { type, id, from, t, sender, author, isGroupMsg, chat, chatId, caption, isMedia, mimetype, quotedMsg, quotedMsgObj, mentionedJidList } = message
        let { body } = message
        var { name, formattedTitle } = chat
        let { pushname, verifiedName, formattedName } = sender
        pushname = pushname || verifiedName || formattedName // verifiedName is the name of someone who uses a business account
        const botNumber = await farrelxd.getHostNumber() + '@c.us'
        const groupId = isGroupMsg ? chat.groupMetadata.id : ''
        const groupAdmins = isGroupMsg ? await farrelxd.getGroupAdmins(groupId) : ''
        const isGroupAdmins = groupAdmins.includes(sender.id) || false
		const chats = (type === 'chat') ? body : (type === 'image' || type === 'video') ? caption : ''
		const pengirim = sender.id
        const isBotGroupAdmins = groupAdmins.includes(botNumber) || false

        // Bot Prefix
        body = (type === 'chat' && body.startsWith(prefix)) ? body : ((type === 'image' && caption || type === 'video' && caption) && caption.startsWith(prefix)) ? caption : ''
        const command = body.slice(1).trim().split(/ +/).shift().toLowerCase()
        const arg = body.trim().substring(body.indexOf(' ') + 1)
        const args = body.trim().split(/ +/).slice(1)
		const argx = chats.slice(0).trim().split(/ +/).shift().toLowerCase()
        const isCmd = body.startsWith(prefix)
        const uaOverride = process.env.UserAgent
        const url = args.length !== 0 ? args[0] : ''
        const isQuotedImage = quotedMsg && quotedMsg.type === 'image'
	    const isQuotedVideo = quotedMsg && quotedMsg.type === 'video'
		
		// [IDENTIFY]
		const isOwnerBot = ownerNumber.includes(pengirim)
        const isBanned = banned.includes(pengirim)
        const ispremiums = premiums.includes(pengirim)
        const isadminbot = adminbot.includes(pengirim)
		const isSimi = simi.includes(chatId)
		const isNgegas = ngegas.includes(chatId)
		const isKasar = await cariKasar(chats)
        //
        if (isCmd && msgFilter.isFiltered(from) && !isGroupMsg && !isOwnerBot && !ispremiums && !isadminbot) { return console.log(color('[SPAM]', 'red'), color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), 'yellow'), color(`${command} [${args.length}]`), 'from', color(pushname)) }
        if (isCmd && msgFilter.isFiltered(from) && isGroupMsg && !isOwnerBot && !ispremiums && !isadminbot) { return console.log(color('[SPAM]', 'red'), color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), 'yellow'), color(`${command} [${args.length}]`), 'from', color(pushname), 'in', color(name || formattedTitle)) }
        //
        if(!isCmd && isKasar && isGroupMsg) { console.log(color('[NgomongKasar]', 'orange'), color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), 'yellow'), color(`${argx}`), 'from', color(pushname), 'in', color(name || formattedTitle)) }
        if (isCmd && !isGroupMsg && !isOwnerBot && !ispremiums && !isadminbot) { console.log(color('[Command]'), color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), 'yellow'), color(`${command} [${args.length}]`), 'from', color(pushname)) }
        if (isCmd && isGroupMsg && !isOwnerBot && !ispremiums && !isadminbot) { console.log(color('[Command]'), color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), 'yellow'), color(`${command} [${args.length}]`), 'from', color(pushname), 'in', color(name || formattedTitle)) }
        //
        if (isCmd && isGroupMsg && isOwnerBot) { console.log(color('[OWNER]', 'blue'), color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), 'blue'), color(`${command} [${args.length}]`), 'from', color(pushname), 'in', color(name || formattedTitle)) }	
        if (isCmd && !isGroupMsg && isOwnerBot) { console.log(color('[OWNER]', 'blue'), color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), 'blue'), color(`${command} [${args.length}]`), 'from', color(pushname)) }
        //
        if (isCmd && isGroupMsg && isadminbot && !isOwnerBot) { console.log(color('[ADMIN]', 'purple'), color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), 'purple'), color(`${command} [${args.length}]`), 'from', color(pushname), 'in', color(name || formattedTitle)) }	
        if (isCmd && !isGroupMsg && isadminbot && !isOwnerBot) { console.log(color('[ADMIN]', 'purple'), color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), 'purple'), color(`${command} [${args.length}]`), 'from', color(pushname)) }
        //
        if (isCmd && isGroupMsg && !isadminbot && !isOwnerBot && ispremiums) { console.log(color('[premium]', 'green'), color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), 'green'), color(`${command} [${args.length}]`), 'from', color(pushname), 'in', color(name || formattedTitle)) }    
        if (isCmd && !isGroupMsg && !isadminbot && !isOwnerBot && ispremiums) { console.log(color('[premium]', 'green'), color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), 'green'), color(`${command} [${args.length}]`), 'from', color(pushname)) }
        //
        const apakah = [
            'Ya',
            'Tidak',
            'Coba Ulangi'
        ]

        const bisakah = [
            'Bisa',
            'Tidak Bisa',
            'Coba Ulangi'
        ]

        const kapankah = [
            '1 Minggu lagi',
            '1 Bulan lagi',
            '1 Tahun lagi',
            'Mungkin lusa',
            'Mungkin besok',
            'tidak akan pernah',
            'coba Ulangi'
        ]

        const cinta = [
            '100%',
            '95%',
            '90%',
            '85%',
            '80%',
            '75%',
            '70%',
            '65%',
            '60%',
            '55%',
            '50%',
            '45%',
            '40%',
            '35%',
            '30%',
            '25%',
            '20%',
            '15%',
            '10%',
            '5%',
            '0%'
        ]

        const truths = [
            'NamaPacar?',
            'Punya Pacar Berapa?',
            'Pernah suka sama seseorang?',
            'Hal terbodoh yang pernah kamu lakukan',
            'kapan Ulang tahun?',
            'Pernah buat surat cinta?',
            'Pernah benci sama temen , dan siapa?',
            'Pernah ngehalu?, dan tentang apa',
            'siapa orang yang kamu benci d grup ini?',
            'kalau kamu bisa menghilang apa hal pertama yang ingin kamu lakukan?'
        ]
        
        const dares = [
            'Chat ke seseorang temanmu (cewek) dan bilang , i love you , ss dan kirim ke grup ini',
            'buat status dan tulis nama temanmu(random) di status itu',
            'pukul tembok 10 kali',
            'buat pantun dan kirim ke temanmu(random)',
            'telp temanmu(random) dan biarkan selama 10 detik',
        ]
        
        const diceno = [
            '1',
            '2',
            '3',
            '4',
            '5',
            '6'
        ]

       const xzxz = `Halo ${pushname}!, aku adalah Lmao Bot! \n Ketik ${prefix}help, untuk memunculkan daftar perintah!`
        

        // [BETA] Avoid Spam Message
        msgFilter.addFilter(from)
	
	//[AUTO READ] Auto read message 
	farrelxd.sendSeen(chatId)
	// Filter Banned People
        if (isBanned) { 
            return console.log(color('[BAN]', 'red'), color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), 'yellow'), color(`${command} [${args.length}]`), 'from', color(pushname))
        }
		
        switch (command) {
        // Menu and Tnc
        case 'news':
        await farrelxd.sendText(from, menuId.news())
        break
        case 'speed':
        case 'ping':
            await farrelxd.sendText(from, `Pong!!!!\nSpeed: ${processTime(t, moment())} _Second_`)
            break
        case 'tnc':
            await farrelxd.sendText(from, menuId.textTnC())
            break
        case 'notes':
        case 'menu':
        case 'help':
            await farrelxd.sendText(from, menuId.textMenu(pushname))
            return farrelxd.sendText(from, `ketik ${prefix}news Untuk melihat apa yang baru di bot ini!`, id)
            .then(() => ((isGroupMsg) && (isGroupAdmins)) ? farrelxd.sendText(from, `Menu Admin Grup: *${prefix}menuadmin*`) : null)
            break
        case 'menuadmin':
            if (!isGroupMsg) return farrelxd.reply(from, 'Maaf, perintah ini hanya dapat dipakai didalam grup!', id)
            if (!isGroupAdmins) return farrelxd.reply(from, 'Gagal, perintah ini hanya dapat digunakan oleh admin grup!', id)
            await farrelxd.sendText(from, menuId.textAdmin())
            break
        case 'donate':
        case 'donasi':
            await farrelxd.sendText(from, menuId.textDonasi())
            break
        case 'ownerbot':
            await farrelxd.sendContact(from, ownerNumber)
            .then(() => farrelxd.sendText(from, 'Jika kalian ingin request fitur silahkan chat nomor owner!'))
            break
        case 'admins':
            await farrelxd.sendContact(from, adminNumber)
            .then(() => farrelxd.sendText(from, 'itu list adminbot!'))
            break 
        case 'premium':
            if (!ispremiums) return farrelxd.reply(from, `${pushname} Kamu belum premiums!, Untuk mendapatkan vvip kamu harus melakukan donasi minimal Rp1 atau bisa klik ${prefix}purchase!`, id)
            return farrelxd.reply(from, `${pushname} Kamu sudah premiums`, id)
             break
        case 'join':
            if (args.length == 0) return farrelxd.reply(from, `Jika kalian ingin mengundang bot kegroup silahkan invite atau dengan\nketik ${prefix}join [link group]`, id)
            let linkgrup = body.slice(6)
            let islink = linkgrup.match(/(https:\/\/chat.whatsapp.com)/gi)
            let chekgrup = await farrelxd.inviteInfo(linkgrup)
            if (!islink) return farrelxd.reply(from, 'Maaf link group-nya salah! silahkan kirim link yang benar', id)
            if (isOwnerBot) {
                await farrelxd.joinGroupViaLink(linkgrup)
                      .then(async () => {
                          await farrelxd.sendText(from, 'Berhasil join grup via link!')
                          await farrelxd.sendText(chekgrup.id, `Hai minna~, Im farrelxd BOT. To find out the commands on this bot type ${prefix}menu`)
                      })
            } else {
                let cgrup = await farrelxd.getAllGroups()
                if (cgrup.length > groupLimit) return farrelxd.reply(from, `Sorry, the group on this bot is full\nMax Group is: ${groupLimit}`, id)
                if (cgrup.size < memberLimit) return farrelxd.reply(from, `Sorry, BOT wil not join if the group members do not exceed ${memberLimit} people`, id)
                await farrelxd.joinGroupViaLink(linkgrup)
                      .then(async () =>{
                          await farrelxd.reply(from, 'Berhasil join grup via link!', id)
                      })
                      .catch(() => {
                          farrelxd.reply(from, 'Gagal!', id)
                      })
            }
            break
        case 'botstat': {
            const loadedMsg = await farrelxd.getAmountOfLoadedMessages()
            const chatIds = await farrelxd.getAllChatIds()
            const groups = await farrelxd.getAllGroups()
            farrelxd.sendText(from, `Status :\n- *${loadedMsg}* Loaded Messages\n- *${groups.length}* Group Chats\n- *${chatIds.length - groups.length}* Personal Chats\n- *${chatIds.length}* Total Chats`)
            break
        }
        // Sticker Creator
        case 'sticker':
        case 'stiker':
            if ((isMedia || isQuotedImage) && args.length === 0) {
                const encryptMedia = isQuotedImage ? quotedMsg : message
                const _mimetype = isQuotedImage ? quotedMsg.mimetype : mimetype
                const mediaData = await decryptMedia(encryptMedia, uaOverride)
                const imageBase64 = `data:${_mimetype};base64,${mediaData.toString('base64')}`
                farrelxd.sendImageAsSticker(from, imageBase64)
                .then(() => {
                    farrelxd.reply(from, 'Here\'s your sticker')
                    console.log(`Sticker Processed for ${processTime(t, moment())} Second`)
                })
            }  else if (args[0] === 'nobg') {
                if (!ispremiums) return farrelxd.reply(from, `Perintah ini hanya untuk premiums , Untuk Cara mendapatkan premiums nya ketik:\n${prefix}Purchase`, id)
                if (isMedia || isQuotedImage) {
                    try {
                    var mediaData = await decryptMedia(message, uaOverride)
                    var imageBase64 = `data:${mimetype};base64,${mediaData.toString('base64')}`
                    var base64img = imageBase64
                    var outFile = './media/noBg.png'
		            // kamu dapat mengambil api key dari website remove.bg dan ubahnya difolder settings/api.json
                    var result = await removeBackgroundFromImageBase64({ base64img, apiKey: apiNoBg, size: 'auto', type: 'auto', outFile })
                    await fs.writeFile(outFile, result.base64img)
                    await farrelxd.sendImageAsSticker(from, `data:${mimetype};base64,${result.base64img}`)
                    } catch(err) {
                    console.log(err)
	   	            await farrelxd.reply(from, 'Tunggu beberapa menit ya kak', id)
                    }
                }
            } else if (args.length === 1) {
                if (!isUrl(url)) { await farrelxd.reply(from, 'Maaf, link yang kamu kirim tidak valid.', id) }
                farrelxd.sendStickerfromUrl(from, url).then((r) => (!r && r !== undefined)
                    ? farrelxd.sendText(from, 'Maaf, link yang kamu kirim tidak memuat gambar.')
                    : farrelxd.reply(from, 'Here\'s your sticker')).then(() => console.log(`Sticker Processed for ${processTime(t, moment())} Second`))
            } else {
                await farrelxd.reply(from, `Tidak ada gambar! Untuk menggunakan ${prefix}sticker\n\n\nKirim gambar dengan caption\n${prefix}sticker <biasa>\n${prefix}sticker nobg <tanpa background>\n\natau Kirim pesan dengan\n${prefix}sticker <link_gambar>`, id)
            }
            break
        case 'stickergif':
        case 'stikergif':
        if (!ispremiums) return farrelxd.reply(from, `Perintah ini hanya untuk premiums , Untuk Cara mendapatkan premiums nya ketik:\n${prefix}Purchase`, id)
            if (isMedia || isQuotedVideo) {
                if (mimetype === 'video/mp4' && message.duration < 10 || mimetype === 'image/gif' && message.duration < 10) {
                    var mediaData = await decryptMedia(message, uaOverride)
                    farrelxd.reply(from, 'Tunggu beberapa menit ya kak ', id)
                    var filename = `./media/stickergif.${mimetype.split('/')[1]}`
                    await fs.writeFileSync(filename, mediaData)
                    await exec(`gify ${filename} ./media/stickergf.gif --fps=30 --scale=240:240`, async function (error, stdout, stderr) {
                        var gif = await fs.readFileSync('./media/stickergf.gif', { encoding: "base64" })
                        await farrelxd.sendImageAsSticker(from, `data:image/gif;base64,${gif.toString('base64')}`)
                        .catch(() => {
                            farrelxd.reply(from, 'Maaf filenya terlalu besar!', id)
                        })
                    })
                  } else {
                    farrelxd.reply(from, `[❗] Kirim gif dengan caption *${prefix}stickergif* max 10 sec!`, id)
                   }
                } else {
		    farrelxd.reply(from, `[❗] Kirim gif dengan caption *${prefix}stickergif*`, id)
	        }
            break
        case 'stikergiphy':
        case 'stickergiphy':
            if (args.length !== 1) return farrelxd.reply(from, `Maaf, format pesan salah.\nKetik pesan dengan ${prefix}stickergiphy <link_giphy>`, id)
            const isGiphy = url.match(new RegExp(/https?:\/\/(www\.)?giphy.com/, 'gi'))
            const isMediaGiphy = url.match(new RegExp(/https?:\/\/media.giphy.com\/media/, 'gi'))
            if (isGiphy) {
                const getGiphyCode = url.match(new RegExp(/(\/|\-)(?:.(?!(\/|\-)))+$/, 'gi'))
                if (!getGiphyCode) { return farrelxd.reply(from, 'Gagal mengambil kode giphy', id) }
                const giphyCode = getGiphyCode[0].replace(/[-\/]/gi, '')
                const smallGifUrl = 'https://media.giphy.com/media/' + giphyCode + '/giphy-downsized.gif'
                farrelxd.sendGiphyAsSticker(from, smallGifUrl).then(() => {
                    farrelxd.reply(from, 'Here\'s your sticker')
                    console.log(`Sticker Processed for ${processTime(t, moment())} Second`)
                }).catch((err) => console.log(err))
            } else if (isMediaGiphy) {
                const gifUrl = url.match(new RegExp(/(giphy|source).(gif|mp4)/, 'gi'))
                if (!gifUrl) { return farrelxd.reply(from, 'Gagal mengambil kode giphy', id) }
                const smallGifUrl = url.replace(gifUrl[0], 'giphy-downsized.gif')
                farrelxd.sendGiphyAsSticker(from, smallGifUrl)
                .then(() => {
                    farrelxd.reply(from, 'Here\'s your sticker')
                    console.log(`Sticker Processed for ${processTime(t, moment())} Second`)
                })
                .catch(() => {
                    farrelxd.reply(from, `Ada yang error!`, id)
                })
            } else {
                await farrelxd.reply(from, 'Maaf, command sticker giphy hanya bisa menggunakan link dari giphy.  [Giphy Only]', id)
            }
            break
        case 'meme':
            if ((isMedia || isQuotedImage) && args.length >= 2) {
                const top = arg.split('|')[0]
                const bottom = arg.split('|')[1]
                const encryptMedia = isQuotedImage ? quotedMsg : message
                const mediaData = await decryptMedia(encryptMedia, uaOverride)
                const getUrl = await uploadImages(mediaData, false)
                const ImageBase64 = await meme.custom(getUrl, top, bottom)
                farrelxd.sendFile(from, ImageBase64, 'image.png', '', null, true)
                    .then(() => {
                        farrelxd.reply(from, 'Ini makasih!',id)
                    })
                    .catch(() => {
                        farrelxd.reply(from, 'Ada yang error!')
                    })
            } else {
                await farrelxd.reply(from, `Tidak ada gambar! Silahkan kirim gambar dengan caption ${prefix}meme <teks_atas> | <teks_bawah>\ncontoh: ${prefix}meme teks atas | teks bawah`, id)
            }
            break
        case 'quotemaker':
            const qmaker = body.trim().split('|')
            if (qmaker.length >= 3) {
                const quotes = qmaker[1]
                const author = qmaker[2]
                const theme = qmaker[3]
                farrelxd.reply(from, 'Maaf kak untuk fitur ini masih eror , akan kami perbaiki secepatnya ya kak , ~Farrel.', id)
                try {
                    const hasilqmaker = await images.quote(quotes, author, theme)
                    farrelxd.sendFileFromUrl(from, `${hasilqmaker}`, '', 'Ini kak..', id)
                } catch {
                    farrelxd.reply('Yahh proses gagal, kakak isinya sudah benar belum?..', id)
                }
            } else {
                farrelxd.reply(from, `Pemakaian ${prefix}quotemaker |isi quote|author|theme\n\ncontoh: ${prefix}quotemaker |aku sayang kamu|-farrelxd|random\n\nuntuk theme nya pakai random ya kak..`)
            }
            break
        case 'nulis':
            if (args.length == 0) return farrelxd.reply(from, `Membuat bot menulis teks yang dikirim menjadi gambar\nPemakaian: ${prefix}nulis [teks]\n\ncontoh: ${prefix}nulis i love you 3000`, id)
            const nulisq = body.slice(7)
            const nulisp = await rugaapi.tulis(nulisq)
            await farrelxd.sendImage(from, `${nulisp}`, '', 'Nih...', id)
            .catch(() => {
                farrelxd.reply(from, 'Ada yang Error!', id)
            })
            break

        //Islam Command
        case 'listsurah':
            try {
                axios.get('https://raw.githubusercontent.com/farrelxdZ/grabbed-results/main/islam/surah.json')
                .then((response) => {
                    let hehex = '╔══✪〘 List Surah 〙✪══\n'
                    for (let i = 0; i < response.data.data.length; i++) {
                        hehex += '╠➥ '
                        hehex += response.data.data[i].name.transliteration.id.toLowerCase() + '\n'
                            }
                        hehex += '╚═〘 *L M A O  B O T* 〙'
                    farrelxd.reply(from, hehex, id)
                })
            } catch(err) {
                farrelxd.reply(from, err, id)
            }
            break
        case 'infosurah':
            if (args.length == 0) return farrelxd.reply(from, `*_${prefix}infosurah <nama surah>_*\nMenampilkan informasi lengkap mengenai surah tertentu. Contoh penggunan: ${prefix}infosurah al-baqarah`, message.id)
                var responseh = await axios.get('https://raw.githubusercontent.com/farrelxdZ/grabbed-results/main/islam/surah.json')
                var { data } = responseh.data
                var idx = data.findIndex(function(post, index) {
                  if((post.name.transliteration.id.toLowerCase() == args[0].toLowerCase())||(post.name.transliteration.en.toLowerCase() == args[0].toLowerCase()))
                    return true;
                });
                var pesan = ""
                pesan = pesan + "Nama : "+ data[idx].name.transliteration.id + "\n" + "Asma : " +data[idx].name.short+"\n"+"Arti : "+data[idx].name.translation.id+"\n"+"Jumlah ayat : "+data[idx].numberOfVerses+"\n"+"Nomor surah : "+data[idx].number+"\n"+"Jenis : "+data[idx].revelation.id+"\n"+"Keterangan : "+data[idx].tafsir.id
                farrelxd.reply(from, pesan, message.id)
              break
        case 'surah':
            if (args.length == 0) return farrelxd.reply(from, `*_${prefix}surah <nama surah> <ayat>_*\nMenampilkan ayat Al-Quran tertentu beserta terjemahannya dalam bahasa Indonesia. Contoh penggunaan : ${prefix}surah al-baqarah 1\n\n*_${prefix}surah <nama surah> <ayat> en/id_*\nMenampilkan ayat Al-Quran tertentu beserta terjemahannya dalam bahasa Inggris / Indonesia. Contoh penggunaan : ${prefix}surah al-baqarah 1 id`, message.id)
                var responseh = await axios.get('https://raw.githubusercontent.com/farrelxdZ/grabbed-results/main/islam/surah.json')
                var { data } = responseh.data
                var idx = data.findIndex(function(post, index) {
                  if((post.name.transliteration.id.toLowerCase() == args[0].toLowerCase())||(post.name.transliteration.en.toLowerCase() == args[0].toLowerCase()))
                    return true;
                });
                nmr = data[idx].number
                if(!isNaN(nmr)) {
                  var responseh2 = await axios.get('https://api.quran.sutanlab.id/surah/'+nmr+"/"+args[1])
                  var {data} = responseh2.data
                  var last = function last(array, n) {
                    if (array == null) return void 0;
                    if (n == null) return array[array.length - 1];
                    return array.slice(Math.max(array.length - n, 0));
                  };
                  bhs = last(args)
                  pesan = ""
                  pesan = pesan + data.text.arab + "\n\n"
                  if(bhs == "en") {
                    pesan = pesan + data.translation.en
                  } else {
                    pesan = pesan + data.translation.id
                  }
                  pesan = pesan + "\n\n(Q.S. "+data.surah.name.transliteration.id+":"+args[1]+")"
                  farrelxd.reply(from, pesan, message.id)
                }
              break
        case 'tafsir':
            if (args.length == 0) return farrelxd.reply(from, `*_${prefix}tafsir <nama surah> <ayat>_*\nMenampilkan ayat Al-Quran tertentu beserta terjemahan dan tafsirnya dalam bahasa Indonesia. Contoh penggunaan : ${prefix}tafsir al-baqarah 1`, message.id)
                var responsh = await axios.get('https://raw.githubusercontent.com/farrelxdZ/grabbed-results/main/islam/surah.json')
                var {data} = responsh.data
                var idx = data.findIndex(function(post, index) {
                  if((post.name.transliteration.id.toLowerCase() == args[0].toLowerCase())||(post.name.transliteration.en.toLowerCase() == args[0].toLowerCase()))
                    return true;
                });
                nmr = data[idx].number
                if(!isNaN(nmr)) {
                  var responsih = await axios.get('https://api.quran.sutanlab.id/surah/'+nmr+"/"+args[1])
                  var {data} = responsih.data
                  pesan = ""
                  pesan = pesan + "Tafsir Q.S. "+data.surah.name.transliteration.id+":"+args[1]+"\n\n"
                  pesan = pesan + data.text.arab + "\n\n"
                  pesan = pesan + "_" + data.translation.id + "_" + "\n\n" +data.tafsir.id.long
                  farrelxd.reply(from, pesan, message.id)
              }
              break
        case 'alaudio':
            if (args.length == 0) return farrelxd.reply(from, `*_${prefix}ALaudio <nama surah>_*\nMenampilkan tautan dari audio surah tertentu. Contoh penggunaan : ${prefix}ALaudio al-fatihah\n\n*_${prefix}ALaudio <nama surah> <ayat>_*\nMengirim audio surah dan ayat tertentu beserta terjemahannya dalam bahasa Indonesia. Contoh penggunaan : ${prefix}ALaudio al-fatihah 1\n\n*_${prefix}ALaudio <nama surah> <ayat> en_*\nMengirim audio surah dan ayat tertentu beserta terjemahannya dalam bahasa Inggris. Contoh penggunaan : ${prefix}ALaudio al-fatihah 1 en`, message.id)
              ayat = "ayat"
              bhs = ""
                var responseh = await axios.get('https://raw.githubusercontent.com/farrelxdZ/grabbed-results/main/islam/surah.json')
                var surah = responseh.data
                var idx = surah.data.findIndex(function(post, index) {
                  if((post.name.transliteration.id.toLowerCase() == args[0].toLowerCase())||(post.name.transliteration.en.toLowerCase() == args[0].toLowerCase()))
                    return true;
                });
                nmr = surah.data[idx].number
                if(!isNaN(nmr)) {
                  if(args.length > 2) {
                    ayat = args[1]
                  }
                  if (args.length == 2) {
                    var last = function last(array, n) {
                      if (array == null) return void 0;
                      if (n == null) return array[array.length - 1];
                      return array.slice(Math.max(array.length - n, 0));
                    };
                    ayat = last(args)
                  } 
                  pesan = ""
                  if(isNaN(ayat)) {
                    var responsih2 = await axios.get('https://raw.githubusercontent.com/farrelxdZ/grabbed-results/main/islam/surah/'+nmr+'.json')
                    var {name, name_translations, number_of_ayah, number_of_surah,  recitations} = responsih2.data
                    pesan = pesan + "Audio Quran Surah ke-"+number_of_surah+" "+name+" ("+name_translations.ar+") "+ "dengan jumlah "+ number_of_ayah+" ayat\n"
                    pesan = pesan + "Dilantunkan oleh "+recitations[0].name+" : "+recitations[0].audio_url+"\n"
                    pesan = pesan + "Dilantunkan oleh "+recitations[1].name+" : "+recitations[1].audio_url+"\n"
                    pesan = pesan + "Dilantunkan oleh "+recitations[2].name+" : "+recitations[2].audio_url+"\n"
                    farrelxd.reply(from, pesan, message.id)
                  } else {
                    var responsih2 = await axios.get('https://api.quran.sutanlab.id/surah/'+nmr+"/"+ayat)
                    var {data} = responsih2.data
                    var last = function last(array, n) {
                      if (array == null) return void 0;
                      if (n == null) return array[array.length - 1];
                      return array.slice(Math.max(array.length - n, 0));
                    };
                    bhs = last(args)
                    pesan = ""
                    pesan = pesan + data.text.arab + "\n\n"
                    if(bhs == "en") {
                      pesan = pesan + data.translation.en
                    } else {
                      pesan = pesan + data.translation.id
                    }
                    pesan = pesan + "\n\n(Q.S. "+data.surah.name.transliteration.id+":"+args[1]+")"
                    await farrelxd.sendFileFromUrl(from, data.audio.secondary[0])
                    await farrelxd.reply(from, pesan, message.id)
                  }
              }
              break
        case 'jsolat':
            if (args.length == 0) return farrelxd.reply(from, `Untuk melihat jadwal solat dari setiap daerah yang ada\nketik: ${prefix}jsolat [daerah]\n\nuntuk list daerah yang ada\nketik: ${prefix}daerah`, id)
            const solatx = body.slice(8)
            const solatj = await rugaapi.jadwaldaerah(solatx)
            await farrelxd.reply(from, solatj, id)
            .catch(() => {
                farrelxd.reply(from, 'Pastikan daerah kamu ada di list ya!', id)
            })
            break
        case 'daerah':
            const daerahq = await rugaapi.daerah()
            await farrelxd.reply(from, daerahq, id)
            .catch(() => {
                farrelxd.reply(from, 'Ada yang Error!', id)
            })
            break
        //Media
        case 'ytmp3':
            if (args.length == 0) return farrelxd.reply(from, `Untuk mendownload lagu dari youtube\nketik: ${prefix}ytmp3 [link_yt]`, id)
            const linkmp3 = args[0].replace('https://youtu.be/','').replace('https://www.youtube.com/watch?v=','')
			rugaapi.ytmp3(`https://youtube.com/${linkmp3}`)
            .then(async(res) => {
				if (res.error) return farrelxd.sendFileFromUrl(from, `${res.url}`, '', `${res.error}`)
				await farrelxd.sendFileFromUrl(from, `${res.result.thumb}`, '', `Lagu ditemukan\n\nJudul: ${res.result.title}\nDesc: ${res.result.desc}\nSabar lagi dikirim`, id)
				await farrelxd.sendFileFromUrl(from, `${res.result.url}`, '', '', id)
				.catch(() => {
					farrelxd.reply(from, `URL INI ${args[0]} SUDAH PERNAH DI DOWNLOAD SEBELUMNYA ..URL AKAN RESET SETELAH 60 MENIT`, id)
				})
			})
            break
        case 'ytmp4':
            if (args.length == 0) return farrelxd.reply(from, `Untuk mendownload lagu dari youtube\nketik: ${prefix}ytmp3 [link_yt]`, id)
            const linkmp4 = args[0].replace('https://youtu.be/','').replace('https://www.youtube.com/watch?v=','')
			rugaapi.ytmp4(`https://youtu.be/${linkmp4}`)
            .then(async(res) => {
				if (res.error) return farrelxd.sendFileFromUrl(from, `${res.url}`, '', `${res.error}`)
				await farrelxd.sendFileFromUrl(from, `${res.result.thumb}`, '', `Lagu ditemukan\n\nJudul: ${res.result.title}\nDesc: ${res.result.desc}\nSabar lagi dikirim`, id)
				await farrelxd.sendFileFromUrl(from, `${res.result.url}`, '', '', id)
				.catch(() => {
					farrelxd.reply(from, `URL INI ${args[0]} SUDAH PERNAH DI DOWNLOAD SEBELUMNYA ..URL AKAN RESET SETELAH 60 MENIT`, id)
				})
			})
            break
		case 'fb':
		case 'facebook':
			if (args.length == 0) return farrelxd.reply(from, `Untuk mendownload video dari link facebook\nketik: ${prefix}fb [link_fb]`, id)
			rugaapi.fb(args[0])
			.then(async (res) => {
				const { link, linkhd, linksd } = res
				if (res.status == 'error') return farrelxd.sendFileFromUrl(from, link, '', 'Maaf url anda tidak dapat ditemukan', id)
				await farrelxd.sendFileFromUrl(from, linkhd, '', 'Nih ngab videonya', id)
				.catch(async () => {
					await farrelxd.sendFileFromUrl(from, linksd, '', 'Nih ngab videonya', id)
					.catch(() => {
						farrelxd.reply(from, 'Maaf url anda tidak dapat ditemukan', id)
					})
				})
			})
			break
			
		//Primbon Menu
		case 'artinama':
			if (args.length == 0) return farrelxd.reply(from, `Untuk mengetahui arti nama seseorang\nketik ${prefix}artinama namakamu`, id)
            rugaapi.artinama(body.slice(10))
			.then(async(res) => {
				await farrelxd.reply(from, `Arti : ${res}`, id)
			})
			break
		case 'cekjodoh':
			if (args.length !== 2) return farrelxd.reply(from, `Untuk mengecek jodoh melalui nama\nketik: ${prefix}cekjodoh nama-kamu nama-pasangan\n\ncontoh: ${prefix}cekjodoh bagas siti\n\nhanya bisa pakai nama panggilan (satu kata)`)
			rugaapi.cekjodoh(args[0],args[1])
			.then(async(res) => {
				await farrelxd.sendFileFromUrl(from, `${res.link}`, '', `${res.text}`, id)
			})
			break
			
        // Random Kata
        case 'fakta':
            fetch('https://raw.githubusercontent.com/farrelxdZ/grabbed-results/main/random/faktaunix.txt')
            .then(res => res.text())
            .then(body => {
                let splitnix = body.split('\n')
                let randomnix = splitnix[Math.floor(Math.random() * splitnix.length)]
                farrelxd.reply(from, randomnix, id)
            })
            .catch(() => {
                farrelxd.reply(from, 'Ada yang Error!', id)
            })
            break
        case 'katabijak':
            fetch('https://raw.githubusercontent.com/farrelxdZ/grabbed-results/main/random/katabijax.txt')
            .then(res => res.text())
            .then(body => {
                let splitbijak = body.split('\n')
                let randombijak = splitbijak[Math.floor(Math.random() * splitbijak.length)]
                farrelxd.reply(from, randombijak, id)
            })
            .catch(() => {
                farrelxd.reply(from, 'Ada yang Error!', id)
            })
            break
        case 'pantun':
            fetch('https://raw.githubusercontent.com/farrelxdZ/grabbed-results/main/random/pantun.txt')
            .then(res => res.text())
            .then(body => {
                let splitpantun = body.split('\n')
                let randompantun = splitpantun[Math.floor(Math.random() * splitpantun.length)]
                farrelxd.reply(from, randompantun.replace(/farrelxd-line/g,"\n"), id)
            })
            .catch(() => {
                farrelxd.reply(from, 'Ada yang Error!', id)
            })
            break
        case 'quote':
            const quotex = await rugaapi.quote()
            await farrelxd.reply(from, quotex, id)
            .catch(() => {
                farrelxd.reply(from, 'Ada yang Error!', id)
            })
            break
		case 'cerpen':
			rugaapi.cerpen()
			.then(async (res) => {
				await farrelxd.reply(from, res.result, id)
			})
			break
		case 'cersex':
			rugaapi.cersex()
			.then(async (res) => {
				await farrelxd.reply(from, res.result, id)
			})
			break
		case 'puisi':
			rugaapi.puisi()
			.then(async (res) => {
				await farrelxd.reply(from, res.result, id)
			})
			break

        //Random Images
        case 'anime':
            if (args.length == 0) return farrelxd.reply(from, `Untuk menggunakan ${prefix}anime\nSilahkan ketik: ${prefix}anime [query]\nContoh: ${prefix}anime random\n\nquery yang tersedia:\nrandom, waifu, husbu, neko`, id)
            if (args[0] == 'random' || args[0] == 'waifu' || args[0] == 'husbu' || args[0] == 'neko') {
                fetch('https://raw.githubusercontent.com/farrelxdZ/grabbed-results/main/random/anime/' + args[0] + '.txt')
                .then(res => res.text())
                .then(body => {
                    let randomnime = body.split('\n')
                    let randomnimex = randomnime[Math.floor(Math.random() * randomnime.length)]
                    farrelxd.sendFileFromUrl(from, randomnimex, '', 'Nee..', id)
                })
                .catch(() => {
                    farrelxd.reply(from, 'Ada yang Error!', id)
                })
            } else {
                farrelxd.reply(from, `Maaf query tidak tersedia. Silahkan ketik ${prefix}anime untuk melihat list query`)
            }
            break
        case 'kpop':
            if (args.length == 0) return farrelxd.reply(from, `Untuk menggunakan ${prefix}kpop\nSilahkan ketik: ${prefix}kpop [query]\nContoh: ${prefix}kpop bts\n\nquery yang tersedia:\nblackpink, exo, bts`, id)
            if (args[0] == 'blackpink' || args[0] == 'exo' || args[0] == 'bts') {
                fetch('https://raw.githubusercontent.com/farrelxdZ/grabbed-results/main/random/kpop/' + args[0] + '.txt')
                .then(res => res.text())
                .then(body => {
                    let randomkpop = body.split('\n')
                    let randomkpopx = randomkpop[Math.floor(Math.random() * randomkpop.length)]
                    farrelxd.sendFileFromUrl(from, randomkpopx, '', 'Nee..', id)
                })
                .catch(() => {
                    farrelxd.reply(from, 'Ada yang Error!', id)
                })
            } else {
                farrelxd.reply(from, `Maaf query tidak tersedia. Silahkan ketik ${prefix}kpop untuk melihat list query`)
            }
            break
        case 'memes':
            const randmeme = await meme.random()
            farrelxd.sendFileFromUrl(from, randmeme, '', '', id)
            .catch(() => {
                farrelxd.reply(from, 'Ada yang Error!', id)
            })
            break
        
        // Search Any
        case 'images':
            if (args.length == 0) return farrelxd.reply(from, `Untuk mencari gambar di pinterest\nketik: ${prefix}images [search]\ncontoh: ${prefix}images naruto`, id)
            const cariwall = body.slice(8)
            const hasilwall = await images.fdci(cariwall)
            await farrelxd.sendFileFromUrl(from, hasilwall, '', '', id)
            .catch(() => {
                farrelxd.reply(from, 'Ada yang Error!', id)
            })
            break
        case 'sreddit':
            if (args.length == 0) return farrelxd.reply(from, `Untuk mencari gambar di sub reddit\nketik: ${prefix}sreddit [search]\ncontoh: ${prefix}sreddit naruto`, id)
            const carireddit = body.slice(9)
            const hasilreddit = await images.sreddit(carireddit)
            await farrelxd.sendFileFromUrl(from, hasilreddit, '', '', id)
            .catch(() => {
                farrelxd.reply(from, 'Ada yang Error!', id)
            })
	    break
        case 'resep':
            if (args.length == 0) return farrelxd.reply(from, `Untuk mencari resep makanan\nCaranya ketik: ${prefix}resep [search]\n\ncontoh: ${prefix}resep tahu`, id)
            const cariresep = body.slice(7)
            const hasilresep = await resep.resep(cariresep)
            await farrelxd.reply(from, hasilresep + '\n\nIni kak resep makanannya..', id)
            .catch(() => {
                farrelxd.reply(from, 'Ada yang Error!', id)
            })
            break
        case 'nekopoi':
             rugapoi.getLatest()
            .then((result) => {
                rugapoi.getVideo(result.link)
                .then((res) => {
                    let heheq = '\n'
                    for (let i = 0; i < res.links.length; i++) {
                        heheq += `${res.links[i]}\n`
                    }
                    farrelxd.reply(from, `Title: ${res.title}\n\nLink:\n${heheq}\nmasih tester bntr :v`)
                })
            })
            .catch(() => {
                farrelxd.reply(from, 'Ada yang Error!', id)
            })
            break
        case 'stalkig':
            if (args.length == 0) return farrelxd.reply(from, `Untuk men-stalk akun instagram seseorang\nketik ${prefix}stalkig [username]\ncontoh: ${prefix}stalkig ini.arga`, id)
            const igstalk = await rugaapi.stalkig(args[0])
            const igstalkpict = await rugaapi.stalkigpict(args[0])
            await farrelxd.sendFileFromUrl(from, igstalkpict, '', igstalk, id)
            .catch(() => {
                farrelxd.reply(from, 'Ada yang Error!', id)
            })
            break
        case 'wiki':
            if (args.length == 0) return farrelxd.reply(from, `Untuk mencari suatu kata dari wikipedia\nketik: ${prefix}wiki [kata]`, id)
            const wikip = body.slice(6)
            const wikis = await rugaapi.wiki(wikip)
            await farrelxd.reply(from, wikis, id)
            .catch(() => {
                farrelxd.reply(from, 'Ada yang Error!', id)
            })
            break
        case 'cuaca':
            if (args.length == 0) return farrelxd.reply(from, `Untuk melihat cuaca pada suatu daerah\nketik: ${prefix}cuaca [daerah]`, id)
            const cuacaq = body.slice(7)
            const cuacap = await rugaapi.cuaca(cuacaq)
            await farrelxd.reply(from, cuacap, id)
            .catch(() => {
                farrelxd.reply(from, 'Ada yang Error!', id)
            })
            break
        case 'lyrics':
        case 'lirik':
            if (args.length == 0) return farrelxd.reply(from, `Untuk mencari lirik dari sebuah lagu\bketik: ${prefix}lirik [judul_lagu]`, id)
            rugaapi.lirik(body.slice(7))
            .then(async (res) => {
                await farrelxd.reply(from, `Lirik Lagu: ${body.slice(7)}\n\n${res}`, id)
            })
            break
        case 'chord':
            if (args.length == 0) return farrelxd.reply(from, `Untuk mencari lirik dan chord dari sebuah lagu\bketik: ${prefix}chord [judul_lagu]`, id)
            const chordq = body.slice(7)
            const chordp = await rugaapi.chord(chordq)
            await farrelxd.reply(from, chordp, id)
            .catch(() => {
                farrelxd.reply(from, 'Ada yang Error!', id)
            })
            break
        case 'ss': //jika error silahkan buka file di folder settings/api.json dan ubah apiSS 'API-KEY' yang kalian dapat dari website https://apiflash.com/
            if (args.length == 0) return farrelxd.reply(from, `Membuat bot men-screenshot sebuah web\n\nPemakaian: ${prefix}ss [url]\n\ncontoh: ${prefix}ss http://google.com`, id)
            const scrinshit = await meme.ss(args[0])
            await farrelxd.sendFile(from, scrinshit, 'ss.jpg', 'cekrek', id)
            .catch(() => {
                farrelxd.reply(from, 'Ada yang Error!', id)
            })
            break
        case 'play'://silahkan kalian custom sendiri jika ada yang ingin diubah
            if (args.length == 0) return farrelxd.reply(from, `Untuk Fitur ini Masih Error , Hanya Bisa Menampilkan Info Dan Gambanya Saa :)`, id)
            axios.get(`https://farrelxdytdl.herokuapp.com/search?q=${body.slice(6)}`)
            .then(async (res) => {
                await farrelxd.sendFileFromUrl(from, `${res.data[0].thumbnail}`, ``, `Lagu ditemukan\n\nJudul: ${res.data[0].title}\nDurasi: ${res.data[0].duration}detik\nUploaded: ${res.data[0].uploadDate}\nView: ${res.data[0].viewCount}\n\nsedang dikirim`, id)
				rugaapi.ytmp3(`https://youtu.be/${res.data[0].id}`)
				.then(async(res) => {
					if (res.status == 'error') return farrelxd.sendFileFromUrl(from, `${res.link}`, '', `${res.error}`)
					await farrelxd.sendFileFromUrl(from, `${res.thumb}`, '', `Lagu ditemukan\n\nJudul ${res.title}\n\nSabar lagi dikirim`, id)
					await farrelxd.sendFileFromUrl(from, `${res.link}`, '', '', id)
					.catch(() => {
						farrelxd.reply(from, `URL INI ${args[0]} SUDAH PERNAH DI DOWNLOAD SEBELUMNYA ..URL AKAN RESET SETELAH 60 MENIT`, id)
					})
				})
            })
            .catch(() => {
                farrelxd.reply(from, 'Ada yang Error!', id)
            })
            break
		case 'movie':
			if (args.length == 0) return farrelxd.reply(from, `Untuk mencari suatu movie dari website sdmovie.fun\nketik: ${prefix}movie judulnya`, id)
			rugaapi.movie((body.slice(7)))
			.then(async (res) => {
				if (res.status == 'error') return farrelxd.reply(from, res.hasil, id)
				await farrelxd.sendFileFromUrl(from, res.link, 'movie.jpg', res.hasil, id)
			})
			break
        case 'whatanime':
            if (isMedia && type === 'image' || quotedMsg && quotedMsg.type === 'image') {
                if (isMedia) {
                    var mediaData = await decryptMedia(message, uaOverride)
                } else {
                    var mediaData = await decryptMedia(quotedMsg, uaOverride)
                }
                const fetch = require('node-fetch')
                const imgBS4 = `data:${mimetype};base64,${mediaData.toString('base64')}`
                farrelxd.reply(from, 'Searching....', id)
                fetch('https://trace.moe/api/search', {
                    method: 'POST',
                    body: JSON.stringify({ image: imgBS4 }),
                    headers: { "Content-Type": "application/json" }
                })
                .then(respon => respon.json())
                .then(resolt => {
                	if (resolt.docs && resolt.docs.length <= 0) {
                		farrelxd.reply(from, 'Maaf, saya tidak tau ini anime apa, pastikan gambar yang akan di Search tidak Buram/Kepotong', id)
                	}
                    const { is_adult, title, title_chinese, title_romaji, title_english, episode, similarity, filename, at, tokenthumb, anilist_id } = resolt.docs[0]
                    teks = ''
                    if (similarity < 0.92) {
                    	teks = '*Saya memiliki keyakinan rendah dalam hal ini* :\n\n'
                    }
                    teks += `➸ *Title Japanese* : ${title}\n➸ *Title chinese* : ${title_chinese}\n➸ *Title Romaji* : ${title_romaji}\n➸ *Title English* : ${title_english}\n`
                    teks += `➸ *R-18?* : ${is_adult}\n`
                    teks += `➸ *Eps* : ${episode.toString()}\n`
                    teks += `➸ *Kesamaan* : ${(similarity * 100).toFixed(1)}%\n`
                    var video = `https://media.trace.moe/video/${anilist_id}/${encodeURIComponent(filename)}?t=${at}&token=${tokenthumb}`;
                    farrelxd.sendFileFromUrl(from, video, 'anime.mp4', teks, id).catch(() => {
                        farrelxd.reply(from, teks, id)
                    })
                })
                .catch(() => {
                    farrelxd.reply(from, 'Ada yang Error!', id)
                })
            } else {
				farrelxd.reply(from, `Maaf format salah\n\nSilahkan kirim foto dengan caption ${prefix}whatanime\n\nAtau reply foto dengan caption ${prefix}whatanime`, id)
			}
            break
            
        // Other Command
        case 'resi':
            if (args.length !== 2) return farrelxd.reply(from, `Maaf, format pesan salah.\nSilahkan ketik pesan dengan ${prefix}resi <kurir> <no_resi>\n\nKurir yang tersedia:\njne, pos, tiki, wahana, jnt, rpx, sap, sicepat, pcp, jet, dse, first, ninja, lion, idl, rex`, id)
            const kurirs = ['jne', 'pos', 'tiki', 'wahana', 'jnt', 'rpx', 'sap', 'sicepat', 'pcp', 'jet', 'dse', 'first', 'ninja', 'lion', 'idl', 'rex']
            if (!kurirs.includes(args[0])) return farrelxd.sendText(from, `Maaf, jenis ekspedisi pengiriman tidak didukung layanan ini hanya mendukung ekspedisi pengiriman ${kurirs.join(', ')} Tolong periksa kembali.`)
            console.log('Memeriksa No Resi', args[1], 'dengan ekspedisi', args[0])
            cekResi(args[0], args[1]).then((result) => farrelxd.sendText(from, result))
            break
        case 'tts':
            if (args.length == 0) return farrelxd.reply(from, `Mengubah teks menjadi sound (google voice)\nketik: ${prefix}tts <kode_bahasa> <teks>\ncontoh : ${prefix}tts id halo\nuntuk kode bahasa cek disini : https://anotepad.com/note/read/5xqahdy8`)
            const ttsGB = require('node-gtts')(args[0])
            const dataText = body.slice(8)
                if (dataText === '') return farrelxd.reply(from, 'apa teksnya syg..', id)
                try {
                    ttsGB.save('./media/tts.mp3', dataText, function () {
                    farrelxd.sendPtt(from, './media/tts.mp3', id)
                    })
                } catch (err) {
                    farrelxd.reply(from, err, id)
                }
            break
        case 'translate':
            if (args.length != 1) return farrelxd.reply(from, `Maaf, format pesan salah.\nSilahkan reply sebuah pesan dengan caption ${prefix}translate <kode_bahasa>\ncontoh ${prefix}translate id`, id)
            if (!quotedMsg) return farrelxd.reply(from, `Maaf, format pesan salah.\nSilahkan reply sebuah pesan dengan caption ${prefix}translate <kode_bahasa>\ncontoh ${prefix}translate id`, id)
            const quoteText = quotedMsg.type == 'chat' ? quotedMsg.body : quotedMsg.type == 'image' ? quotedMsg.caption : ''
            translate(quoteText, args[0])
                .then((result) => farrelxd.sendText(from, result))
                .catch(() => farrelxd.sendText(from, 'Error, Kode bahasa salah.'))
            break
		case 'covidindo':
			rugaapi.covidindo()
			.then(async (res) => {
				await farrelxd.reply(from, `${res}`, id)
			})
			break
        case 'ceklokasi':
            if (quotedMsg.type !== 'location') return farrelxd.reply(from, `Maaf, format pesan salah.\nKirimkan lokasi dan reply dengan caption ${prefix}ceklokasi`, id)
            console.log(`Request Status Zona Penyebaran Covid-19 (${quotedMsg.lat}, ${quotedMsg.lng}).`)
            const zoneStatus = await getLocationData(quotedMsg.lat, quotedMsg.lng)
            if (zoneStatus.kode !== 200) farrelxd.sendText(from, 'Maaf, Terjadi error ketika memeriksa lokasi yang anda kirim.')
            let datax = ''
            for (let i = 0; i < zoneStatus.data.length; i++) {
                const { zone, region } = zoneStatus.data[i]
                const _zone = zone == 'green' ? 'Hijau* (Aman) \n' : zone == 'yellow' ? 'Kuning* (Waspada) \n' : 'Merah* (Bahaya) \n'
                datax += `${i + 1}. Kel. *${region}* Berstatus *Zona ${_zone}`
            }
            const text = `*CEK LOKASI PENYEBARAN COVID-19*\nHasil pemeriksaan dari lokasi yang anda kirim adalah *${zoneStatus.status}* ${zoneStatus.optional}\n\nInformasi lokasi terdampak disekitar anda:\n${datax}`
            farrelxd.sendText(from, text)
            break
        case 'shortlink':
        if (!isvvip) return farrelxd.reply(from, `Perintah ini hanya untuk Vvip , Untuk Cara mendapatkan vvip nya ketik:\n${prefix}Purchase`, id)
            if (args.length == 0) return farrelxd.reply(from, `ketik ${prefix}shortlink <url>`, id)
            if (!isUrl(args[0])) return farrelxd.reply(from, 'Maaf, url yang kamu kirim tidak valid.', id)
            const shortlink = await urlShortener(args[0])
            await farrelxd.sendText(from, shortlink)
            .catch(() => {
                farrelxd.reply(from, 'Ada yang Error!', id)
            })
            break
		case 'bapakfont':
			if (args.length == 0) return farrelxd.reply(from, `Mengubah kalimat menjadi alayyyyy\n\nketik ${prefix}bapakfont kalimat`, id)
			rugaapi.bapakfont(body.slice(11))
			.then(async(res) => {
				await farrelxd.reply(from, `${res}`, id)
			})
			break
            case 'say':
            if (args.length == 0) return farrelxd.reply(from, `Untuk say ke semua chat ketik:\n${prefix}say [isi chat]`, id)
            let messages = body.slice(5)
        return farrelxd.sendText(from, `${messages}`, id)
        break

		//Fun Menu
        case 'klasemen':
        case 'klasmen':
            if (!isGroupMsg) return farrelxd.reply(from, 'Maaf, perintah ini hanya dapat dipakai didalam grup!', id)
            const klasemen = db.get('group').filter({id: groupId}).map('members').value()[0]
            let urut = Object.entries(klasemen).map(([key, val]) => ({id: key, ...val})).sort((a, b) => b.denda - a.denda);
            let textKlas = "Klasemen Denda Sementara\n"
            let i = 1;
            urut.forEach((klsmn) => {
            textKlas += i+". @"+klsmn.id.replace('@c.us', '')+" ➤ Rp"+formatin(klsmn.denda)+"\n"
            i++
            });
            await farrelxd.sendTextWithMentions(from, textKlas)
            break
        case 'apakah':
        if (!isGroupMsg) return farrelxd.reply(from, 'Maaf, perintah ini hanya dapat dipakai didalam grup!', id)
        if (args.length == 0) return farrelxd.reply(from, `Untuk menanyakan kepada kerang ajaib , (contoh) ketik ${prefix}apakah aku ganteng?`, id)
        const jawab =  apakah[Math.floor(Math.random() * (apakah.length))]
        return farrelxd.reply(from, `${jawab}`, id)
        break
        case 'bisakah':
        if (!isGroupMsg) return farrelxd.reply(from, 'Maaf, perintah ini hanya dapat dipakai didalam grup!', id)
        if (args.length == 0) return farrelxd.reply(from, `Untuk menanyakan kepada kerang ajaib , (contoh) ketik ${prefix}bisakah aku nikah?`, id)
        const bisaga = bisakah[Math.floor(Math.random() * (bisakah.length))]
        return farrelxd.reply(from, `${bisaga}`, id)
        break
        case 'kapan':
        if (!isGroupMsg) return farrelxd.reply(from, 'Maaf, perintah ini hanya dapat dipakai didalam grup!', id)
         if (args.length == 0) return farrelxd.reply(from, `Untuk menanyakan kepada kerang ajaib , (contoh) ketik ${prefix}kapan aku nikah?`, id)
        const kayanya = kapankah[Math.floor(Math.random() * (kapankah.length))]
        return farrelxd.reply(from, `${kayanya}`, id)
        break
        case 'cinta':
        if (!isGroupMsg) return farrelxd.reply(from, 'Maaf, perintah ini hanya dapat dipakai didalam grup!', id)
        if (args.length == 0) return farrelxd.reply(from, `Untuk menanyakan kepada kerang ajaib , (contoh) ketik ${prefix}cinta aku dan dia?`, id)
        const jomblo = cinta[Math.floor(Math.random() * (cinta.length))]
        return farrelxd.reply(from, `${jomblo}`. id)
        break
        case 'tod':
        if (!isGroupMsg) return farrelxd.reply(from, 'Maaf, perintah ini hanya dapat dipakai didalam grup!', id) 
        const acak = await farrelxd.getGroupMembersId(groupId)
        let acak2 = acak[Math.floor(Math.random() * (acak.length))]
        const peserta = `Truth or Dare kali ini ditujukan kepada @${acak2}, tolong reply pesan ini dengan ${prefix}truth atau ${prefix}dare!`
        return farrelxd.sendTextWithMentions(from, peserta, id)
        break
        case 'truth':
            if (!quotedMsg) return farrelxd.reply(from, 'Reply pesannya!', id)
            const ssksl = truths[Math.floor(Math.random() * (truths.length))]
            farrelxd.reply(from, ssksl, id)
            break
        case 'dare':
            if (!quotedMsg) return farrelxd.reply(from, 'Reply pesannya!', id)
            const xdxdxd = dares[Math.floor(Math.random() * (dares.length))]
            farrelxd.reply(from, xdxdxd, id)
            break
        case 'random':
        if (!isOwnerBot) return farrelxd.reply(from, 'Perintah ini hanya untuk Owner bot!', id)
        	if (!isGroupMsg) return farrelxd.reply(from, 'Maaf, perintah ini hanya dapat dipakai didalam grup!', id)
        const acakgiveaway = await farrelxd.getGroupMembersId(groupId)
         let acakgiveaway2 = acakgiveaway [Math.floor(Math.random() * (acakgiveaway.length))]
        const pemenang = `@${acakgiveaway2},`
        return farrelxd.sendTextWithMentions(from, pemenang, id)
        break
        case 'dice':
        if (!isGroupMsg) return farrelxd.reply(from, 'Maaf, perintah ini hanya dapat dipakai didalam grup!', id) 
        const diceacak = diceno[Math.floor(Math.random() * (diceno.length))]
        const diceacak2 = diceno[Math.floor(Math.random() * (diceno.length))]
        return farrelxd.reply(from, `${diceacak} dan ${diceacak2}`, id)
        break
        case 'jodoh':
        if (!isGroupMsg) return farrelxd.reply(from, 'Maaf, perintah ini hanya dapat dipakai didalam grup!', id) 
        if (!quotedMsg) return farrelxd.reply(from, `*Perhatian Di Larang keras untuk baper !*, Reply pesan ini untuk menggunakan perintah ${prefix}jodoh`, id)
        const listjodoh = await farrelxd.getGroupMembersId(groupId)
        let acakjodoh = listjodoh[Math.floor(Math.random() * (listjodoh.length))]
        let acakjodoh2 = listjodoh[Math.floor(Math.random() * (listjodoh.length))]
        const cie1 = `@${acakjodoh}`
        const cie2 = `@${acakjodoh2}`
        return farrelxd.sendTextWithMentions(from, `saya jodohkan \n${cie1} \ndengan....`, id)
        .then(() => farrelxd.sendTextWithMentions(from, `${cie2}`, id))
        break

        // Group Commands
        case 'groupinfo':
            if (!isGroupMsg) return farrelxd.reply(from, 'Perintah ini hanya bisa digunakan dalam group!',id)
                var totalMem = chat.groupMetadata.participants.length
                var desc = chat.groupMetadata.desc
                var groupname = formattedTitle
                var owner_ = chat.groupMetadata.owner
                const onwergroupxd = `*➸ Owner Group  : @${owner_}*`
                farrelxd.sendTextWithMentions(from, onwergroupxd, id)
            const datagroup = `
*➸ Name : ${groupname}*
*➸ Members : ${totalMem}*
*➸ Group Description : ${desc}*
`
            farrelxd.sendText(from, datagroup, id)
            break
        case `setgroupname`:
                    if (!isGroupMsg) return farrelxd.reply(dari, `Fitur ini hanya bisa di gunakan dalam group`, id)
                    if (!isGroupAdmins) return farrelxd.reply(dari, `Fitur ini hanya bisa di gunakan oleh admin group`, id)
                    if (!isBotGroupAdmins) return farrelxd.reply(dari, `Fitur ini hanya bisa di gunakan ketika bot menjadi admin`, id)
                    const namagrup = body.slice(14)
                    let sebelum = chat.groupMetadata.formattedName
                    let halaman = global.page ? global.page : await farrelxd.getPage()
                    await halaman.evaluate((chatId, subject) =>
                        Store.WapQuery.changeSubject(chatId, subject), groupId, `${namagrup}`)
                    farrelxd.sendTextWithMentions(from, `Nama group telah diubah oleh admin @${sender.id.replace('@c.us','')}\n\n• Before: ${sebelum}\n• After: ${namagrup}`)
                    break
	    case 'add':
            if (!isGroupMsg) return farrelxd.reply(from, 'Maaf, perintah ini hanya dapat dipakai didalam grup!', id)
            if (!isGroupAdmins) return farrelxd.reply(from, 'Gagal, perintah ini hanya dapat digunakan oleh admin grup!', id)
            if (!isBotGroupAdmins) return farrelxd.reply(from, 'Gagal, silahkan tambahkan bot sebagai admin grup!', id)
	        if (args.length !== 1) return farrelxd.reply(from, `Untuk menggunakan ${prefix}add\nPenggunaan: ${prefix}add <nomor>\ncontoh: ${prefix}add 628xxx`, id)
                try {
                    await farrelxd.addParticipant(from,`${args[0]}@c.us` )
                } catch {
                    farrelxd.reply(from, 'Tidak dapat menambahkan target', id)
                }
            break
        case 'kick':
            if (!isGroupMsg) return farrelxd.reply(from, 'Maaf, perintah ini hanya dapat dipakai didalam grup!', id)
            if (!isGroupAdmins) return farrelxd.reply(from, 'Gagal, perintah ini hanya dapat digunakan oleh admin grup!', id)
            if (!isBotGroupAdmins) return farrelxd.reply(from, 'Gagal, silahkan tambahkan bot sebagai admin grup!', id)
            if (mentionedJidList.length === 0) return farrelxd.reply(from, 'Maaf, format pesan salah.\nSilahkan tag satu atau lebih orang yang akan dikeluarkan', id)
            if (mentionedJidList[0] === botNumber) return await farrelxd.reply(from, 'Maaf, format pesan salah.\nTidak dapat mengeluarkan akun bot sendiri', id)
            await farrelxd.sendTextWithMentions(from, `Request diterima, mengeluarkan:\n${mentionedJidList.map(x => `@${x.replace('@c.us', '')}`).join('\n')}`)
            for (let i = 0; i < mentionedJidList.length; i++) {
                if (groupAdmins.includes(mentionedJidList[i])) return await farrelxd.sendText(from, 'Gagal, kamu tidak bisa mengeluarkan admin grup.')
                await farrelxd.removeParticipant(groupId, mentionedJidList[i])
            }
            break
        case 'promote':
            if (!isGroupMsg) return farrelxd.reply(from, 'Maaf, perintah ini hanya dapat dipakai didalam grup!', id)
            if (!isGroupAdmins) return farrelxd.reply(from, 'Gagal, perintah ini hanya dapat digunakan oleh admin grup!', id)
            if (!isBotGroupAdmins) return farrelxd.reply(from, 'Gagal, silahkan tambahkan bot sebagai admin grup!', id)
            if (mentionedJidList.length !== 1) return farrelxd.reply(from, 'Maaf, hanya bisa mempromote 1 user', id)
            if (groupAdmins.includes(mentionedJidList[0])) return await farrelxd.reply(from, 'Maaf, user tersebut sudah menjadi admin.', id)
            if (mentionedJidList[0] === botNumber) return await farrelxd.reply(from, 'Maaf, format pesan salah.\nTidak dapat mempromote akun bot sendiri', id)
            await farrelxd.promoteParticipant(groupId, mentionedJidList[0])
            await farrelxd.sendTextWithMentions(from, `Request diterima, selamr sekarang lu jadi admin @${mentionedJidList[0].replace('@c.us', '')} Bilang makasih dong.`)
            break
        case 'demote':
            if (!isGroupMsg) return farrelxd.reply(from, 'Maaf, perintah ini hanya dapat dipakai didalam grup!', id)
            if (!isGroupAdmins) return farrelxd.reply(from, 'Gagal, perintah ini hanya dapat digunakan oleh admin grup!', id)
            if (!isBotGroupAdmins) return farrelxd.reply(from, 'Gagal, silahkan tambahkan bot sebagai admin grup!', id)
            if (mentionedJidList.length !== 1) return farrelxd.reply(from, 'Maaf, hanya bisa mendemote 1 user', id)
            if (!groupAdmins.includes(mentionedJidList[0])) return await farrelxd.reply(from, 'Maaf, user tersebut belum menjadi admin.', id)
            if (mentionedJidList[0] === botNumber) return await farrelxd.reply(from, 'Maaf, format pesan salah.\nTidak dapat mendemote akun bot sendiri', id)
            await farrelxd.demoteParticipant(groupId, mentionedJidList[0])
            await farrelxd.sendTextWithMentions(from, `Request diterima, Mampus Di Demote @${mentionedJidList[0].replace('@c.us', '')}.`)
            break
        case 'bye':
            if (!isGroupMsg) return farrelxd.reply(from, 'Maaf, perintah ini hanya dapat dipakai didalam grup!', id)
            if (!isGroupAdmins) return farrelxd.reply(from, 'Gagal, perintah ini hanya dapat digunakan oleh admin grup!', id)
            farrelxd.sendText(from, 'Good bye... Aku Di Suruh Sama Admin Untuk Kelar Group ini ( ⇀‸↼‶ )').then(() => farrelxd.leaveGroup(groupId))
            break
        case 'del':
            if (!isGroupAdmins) return farrelxd.reply(from, 'Gagal, perintah ini hanya dapat digunakan oleh admin grup!', id)
            if (!quotedMsg) return farrelxd.reply(from, `Maaf, format pesan salah silahkan.\nReply pesan bot dengan caption ${prefix}del`, id)
            if (!quotedMsgObj.fromMe) return farrelxd.reply(from, `Maaf, format pesan salah silahkan.\nReply pesan bot dengan caption ${prefix}del`, id)
            farrelxd.deleteMessage(quotedMsgObj.chatId, quotedMsgObj.id, false)
            break
        case 'tagall':
        case 'everyone':
            if (!isGroupMsg) return farrelxd.reply(from, 'Maaf, perintah ini hanya dapat dipakai didalam grup!', id)
            if (!isGroupAdmins) return farrelxd.reply(from, 'Gagal, perintah ini hanya dapat digunakan oleh admin grup!', id)
            const groupMem = await farrelxd.getGroupMembers(groupId)
            let hehex = '╔══✪〘 Mention All 〙✪══\n'
            for (let i = 0; i < groupMem.length; i++) {
                hehex += '╠➥'
                hehex += ` @${groupMem[i].id.replace(/@c.us/g, '')}\n`
            }
            hehex += '╚═〘 *L M A O  B O T* 〙'
            await farrelxd.sendTextWithMentions(from, hehex)
            break
		case 'simisimi':
			if (!isGroupMsg) return farrelxd.reply(from, 'Maaf, perintah ini hanya dapat dipakai didalam grup!', id)
			farrelxd.reply(from, `Untuk mengaktifkan simi-simi pada Group Chat\n\nPenggunaan\n${prefix}simi on --mengaktifkan\n${prefix}simi off --nonaktifkan\n`, id)
			break
		case 'simi':
			if (!isGroupMsg) return farrelxd.reply(from, 'Maaf, perintah ini hanya dapat dipakai didalam grup!', id)
            if (!isGroupAdmins) return farrelxd.reply(from, 'Gagal, perintah ini hanya dapat digunakan oleh admin grup!', id)
			if (args.length !== 1) return farrelxd.reply(from, `Untuk mengaktifkan simi-simi pada Group Chat\n\nPenggunaan\n${prefix}simi on --mengaktifkan\n${prefix}simi off --nonaktifkan\n`, id)
			if (args[0] == 'on') {
				simi.push(chatId)
				fs.w
                riteFileSync('./settings/simi.json', JSON.stringify(simi))
                farrelxd.reply(from, 'Mengaktifkan bot simi-simi!', id)
			} else if (args[0] == 'off') {
				let inxx = simi.indexOf(chatId)
				simi.splice(inxx, 1)
				fs.writeFileSync('./settings/simi.json', JSON.stringify(simi))
				farrelxd.reply(from, 'Menonaktifkan bot simi-simi!', id)
			} else {
				farrelxd.reply(from, `Untuk mengaktifkan simi-simi pada Group Chat\n\nPenggunaan\n${prefix}simi on --mengaktifkan\n${prefix}simi off --nonaktifkan\n`, id)
			}
			break
		case 'katakasar':
			if (!isGroupMsg) return farrelxd.reply(from, 'Maaf, perintah ini hanya dapat dipakai didalam grup!', id)
			farrelxd.reply(from, `Untuk mengaktifkan Fitur Kata Kasar pada Group Chat\n\nApasih kegunaan Fitur Ini? Apabila seseorang mengucapkan kata kasar akan mendapatkan denda\n\nPenggunaan\n${prefix}kasar on --mengaktifkan\n${prefix}kasar off --nonaktifkan\n\n${prefix}reset --reset jumlah denda`, id)
			break
		case 'kasar':
			if (!isGroupMsg) return farrelxd.reply(from, 'Maaf, perintah ini hanya dapat dipakai didalam grup!', id)
            if (!isGroupAdmins) return farrelxd.reply(from, 'Gagal, perintah ini hanya dapat digunakan oleh admin grup!', id)
			if (args.length !== 1) return farrelxd.reply(from, `Untuk mengaktifkan Fitur Kata Kasar pada Group Chat\n\nApasih kegunaan Fitur Ini? Apabila seseorang mengucapkan kata kasar akan mendapatkan denda\n\nPenggunaan\n${prefix}kasar on --mengaktifkan\n${prefix}kasar off --nonaktifkan\n\n${prefix}reset --reset jumlah denda`, id)
			if (args[0] == 'on') {
				ngegas.push(chatId)
				fs.writeFileSync('./settings/ngegas.json', JSON.stringify(ngegas))
				farrelxd.reply(from, 'Fitur Anti Kasar sudah di Aktifkan , Jangan Spam Ya Su', id)
			} else if (args[0] == 'off') {
				let nixx = ngegas.indexOf(chatId)
				ngegas.splice(nixx, 1)
				fs.writeFileSync('./settings/ngegas.json', JSON.stringify(ngegas))
				farrelxd.reply(from, 'Fitur Anti Kasar sudah di non-Aktifkan', id)
			} else {
				farrelxd.reply(from, `Untuk mengaktifkan Fitur Kata Kasar pada Group Chat\n\nApasih kegunaan Fitur Ini? Apabila seseorang mengucapkan kata kasar akan mendapatkan denda\n\nPenggunaan\n${prefix}kasar on --mengaktifkan\n${prefix}kasar off --nonaktifkan\n\n${prefix}reset --reset jumlah denda`, id)
			}
			break
		case 'reset':
			if (!isGroupMsg) return farrelxd.reply(from, 'Maaf, perintah ini hanya dapat dipakai didalam grup!', id)
            if (!isGroupAdmins) return farrelxd.reply(from, 'Gagal, perintah ini hanya dapat digunakan oleh admin grup!', id)
			const reset = db.get('group').find({ id: groupId }).assign({ members: []}).write()
            if(reset){
				await farrelxd.sendText(from, "Klasemen telah direset.")
            }
			break
		case 'mutegrup':
			if (!isGroupMsg) return farrelxd.reply(from, 'Maaf, perintah ini hanya dapat dipakai didalam grup!', id)
            if (!isGroupAdmins) return farrelxd.reply(from, 'Gagal, perintah ini hanya dapat digunakan oleh admin grup!', id)
            if (!isBotGroupAdmins) return farrelxd.reply(from, 'Gagal, silahkan tambahkan bot sebagai admin grup!', id)
			if (args.length !== 1) return farrelxd.reply(from, `Untuk mengubah settingan group chat agar hanya admin saja yang bisa chat\n\nPenggunaan:\n${prefix}mutegrup on --aktifkan\n${prefix}mutegrup off --nonaktifkan`, id)
            if (args[0] == 'on') {
				farrelxd.setGroupToAdminsOnly(groupId, true).then(() => farrelxd.sendText(from, 'Berhasil mengubah agar hanya admin yang dapat chat!'))
			} else if (args[0] == 'off') {
				farrelxd.setGroupToAdminsOnly(groupId, false).then(() => farrelxd.sendText(from, 'Berhasil mengubah agar semua anggota dapat chat!'))
			} else {
				farrelxd.reply(from, `Untuk mengubah settingan group chat agar hanya admin saja yang bisa chat\n\nPenggunaan:\n${prefix}mutegrup on --aktifkan\n${prefix}mutegrup off --nonaktifkan`, id)
			}
			break
            return farrelxd.reply(from , 'Perintah Ini sedang dalam tahap pembuatan', id)     
		case 'setprofile':
			if (!isGroupMsg) return farrelxd.reply(from, 'Maaf, perintah ini hanya dapat dipakai didalam grup!', id)
            if (!isGroupAdmins) return farrelxd.reply(from, 'Gagal, perintah ini hanya dapat digunakan oleh admin grup!', id)
            if (!isBotGroupAdmins) return farrelxd.reply(from, 'Gagal, silahkan tambahkan bot sebagai admin grup!', id)
			if (isMedia && type == 'image' || isQuotedImage) {
				const dataMedia = isQuotedImage ? quotedMsg : message
				const _mimetype = dataMedia.mimetype
				const mediaData = await decryptMedia(dataMedia, uaOverride)
				const imageBase64 = `data:${_mimetype};base64,${mediaData.toString('base64')}`
				await farrelxd.setGroupIcon(groupId, imageBase64)
			} else if (args.length === 1) {
				if (!isUrl(url)) { await farrelxd.reply(from, 'Maaf, link yang kamu kirim tidak valid.', id) }
				farrelxd.setGroupIconByUrl(groupId, url).then((r) => (!r && r !== undefined)
				? farrelxd.reply(from, 'Maaf, link yang kamu kirim tidak memuat gambar.', id)
				: farrelxd.reply(from, 'Berhasil mengubah profile group', id))
			} else {
				farrelxd.reply(from, `Commands ini digunakan untuk mengganti icon/profile group chat\n\n\nPenggunaan:\n1. Silahkan kirim/reply sebuah gambar dengan caption ${prefix}setprofile\n\n2. Silahkan ketik ${prefix}setprofile linkImage`)
			    break
            }
			
        //Owner Group
        case 'kickall': //mengeluarkan semua member
        if (!isGroupMsg) return farrelxd.reply(from, 'Maaf, perintah ini hanya dapat dipakai didalam grup!', id)
        let isOwner = chat.groupMetadata.owner == pengirim
        if (!isOwner) return farrelxd.reply(from, 'Maaf, perintah ini hanya dapat dipakai oleh owner grup!', id)
        if (!isBotGroupAdmins) return farrelxd.reply(from, 'Gagal, silahkan tambahkan bot sebagai admin grup!', id)
            const allMem = await farrelxd.getGroupMembers(groupId)
            for (let i = 0; i < allMem.length; i++) {
                if (groupAdmins.includes(allMem[i].id)) {

                } else {
                    await farrelxd.removeParticipant(groupId, allMem[i].id)
                }
            }
            farrelxd.reply(from, 'Success kick all member', id)
        break

        //Owner Bot
        case 'report':
        if (args.length == 0) return farrelxd.reply(from, `Jika ingin mereport , ketik ${prefix}report dan tulis laporan nya , jika spam akan admin blok nomor nya`, id)
        let reports = body.slice(6)
        return farrelxd.sendText(adminNumber, `${reports}`)
        break
        case 'request':
        if (args.length == 0) return farrelxd.reply(from, `Jika ingin request fitur, ketik ${prefix}request dan tulis requestan nya , jika spam akan owner blok nomor nya`, id)
        let requests = body.slice(7)
        return farrelxd.sendText(ownerNumber, `${requests}`)
        break
        case 'ban':
            if (!isadminbot) return farrelxd.reply(from, 'Perintah ini hanya untuk Owner/admin bot!', id)
            if (args.length == 0) return farrelxd.reply(from, `Untuk banned seseorang agar tidak bisa menggunakan commands\n\nCaranya ketik: \n${prefix}ban add 628xx --untuk mengaktifkan\n${prefix}ban del 628xx --untuk nonaktifkan\n\ncara cepat ban banyak digrup ketik:\n${prefix}ban @tag @tag @tag`, id)
            if (args[0] == 'add') {
                banned.push(args[1]+'@c.us')
                fs.writeFileSync('./settings/banned.json', JSON.stringify(banned))
                farrelxd.reply(from, 'Success banned target!')
            } else
            if (args[0] == 'del') {
                let xnxx = banned.indexOf(args[1]+'@c.us')
                banned.splice(xnxx,1)
                fs.writeFileSync('./settings/banned.json', JSON.stringify(banned))
                farrelxd.reply(from, 'Success unbanned target!')
            } else {
             for (let i = 0; i < mentionedJidList.length; i++) {
                banned.push(mentionedJidList[i])
                fs.writeFileSync('./settings/banned.json', JSON.stringify(banned))
                farrelxd.reply(from, 'Success ban target!', id)
                }
            }
            break
        case 'bc': //untuk broadcast atau promosi
            if (!isOwnerBot) return farrelxd.reply(from, 'Perintah ini hanya untuk Owner bot!', id)
            if (args.length == 0) return farrelxd.reply(from, `Untuk broadcast ke semua chat ketik:\n${prefix}bc [isi chat]`)
            let msg = body.slice(4)
            const chatz = await farrelxd.getAllChatIds()
            for (let idk of chatz) {
                var cvk = await farrelxd.getChatById(idk)
                if (!cvk.isReadOnly) farrelxd.sendText(idk, `〘 *L M A O B C* 〙\n\n${msg}`)
                if (cvk.isReadOnly) farrelxd.sendText(idk, `〘 *L M A. O B C* 〙\n\n${msg}`)
            }
            farrelxd.reply(from, 'Broadcast Success!', id)
            break
        case 'leaveall': //mengeluarkan bot dari semua group serta menghapus chatnya
            if (!isOwnerBot) return farrelxd.reply(from, 'Perintah ini hanya untuk Owner bot', id)
            const allChatz = await farrelxd.getAllChatIds()
            const allGroupz = await farrelxd.getAllGroups()
            for (let gclist of allGroupz) {
                await farrelxd.sendText(gclist.contact.id, `Maaf bot sedang pembersihan, total chat aktif : ${allChatz.length}`)
                await farrelxd.leaveGroup(gclist.contact.id)
                await farrelxd.deleteChat(gclist.contact.id)
            }
            farrelxd.reply(from, 'Success leave all group!', id)
            break
        case 'clearall': //menghapus seluruh pesan diakun bot
            if (!isOwnerBot) return farrelxd.reply(from, 'Perintah ini hanya untuk Owner bot', id)
            const allChatx = await farrelxd.getAllChats()
            for (let dchat of allChatx) {
                await farrelxd.deleteChat(dchat.id)
            }
            farrelxd.reply(from, 'Success clear all chat!', id)
            break
        default:
            break
        case 'adminbot':
              if (!isOwnerBot) return farrelxd.reply(from, 'Perintah ini hanya untuk Owner bot!', id)
            if (args.length == 0) return farrelxd.reply(from, `Untuk menambahkan seseorag ke admin rank Caranya ketik: \n${prefix}admin add 628xx --untuk menaktifkan\n${prefix}admin del 628xx --untuk nonaktifkan\n\ncara cepat add admin banyak digrup ketik:\n${prefix}admin @tag @tag @tag`, id)
            if (args[0] == 'add') {
                adminbot.push(args[1]+'@c.us')
                fs.writeFileSync('./settings/adminbot.json', JSON.stringify(adminbot))
                farrelxd.reply(from, 'Success added to admin !', id)
            } else
            if (args[0] == 'del') {
                let xnxx = adminbot.indexOf(args[1]+'@c.us')
                adminbot.splice(xnxx,1)
                fs.writeFileSync('./settings/adminbot.json', JSON.stringify(adminbot))
                farrelxd.reply(from, 'Success deleted from admin!', id)
            } else {
             for (let i = 0; i < mentionedJidList.length; i++) {
                adminbot.push(mentionedJidList[i])
                fs.writeFileSync('./settings/adminbot.json', JSON.stringify(adminbot))
                farrelxd.reply(from, 'Success added to admin!', id)
                break
                }
            }

        case 'premiummenu':
        return farrelxd.sendText(from, menuId.vvip(pushname))
        break
        case 'Purchase':
        return farrelxd.reply(from, 'Jika Ingin Purchase premiums , kamu bisa donasi minimal Rp1 Untuk mendapatkan premiums atau kamu bisa chat owner bot ini', id)
    break
    case 'premiumbc':
            if (!ispremiums) return farrelxd.reply(from, 'Perintah ini hanya untuk premiums!', id)
            if (args.length == 0) return farrelxd.reply(from, `Untuk vipbc ke semua chat ketik:\n${prefix}premiumsbc [isi chat]`, id)
            let premiumsbc = body.slice(6)
        return farrelxd.reply(from, `〘 *premium B C*〙\n\n${premiumsbc}`, id)
        break
    case 'premiums':
            if (!isadminbot) return farrelxd.reply(from, 'Perintah ini hanya untuk Owner/admin bot!', id)
            if (args.length == 0) return farrelxd.reply(from, `Untuk menambahkan seseorag ke premium rank Caranya ketik: \n${prefix}premiums add 628xx --untuk menaktifkan\n${prefix}premiums del 628xx --untuk nonaktifkan\n\ncara cepat menambahkan premium banyak digrup ketik:\n${prefix}premiums @tag @tag @tag`, id)
            if (args[0] == 'add') {
                premiums.push(args[1]+'@c.us')
                fs.writeFileSync('./settings/premiums.json', JSON.stringify(premiums))
                farrelxd.reply(from, 'Success added to premiums !', id)
            } else
            if (args[0] == 'del') {
                let xnxx = premiums.indexOf(args[1]+'@c.us')
                premiums.splice(xnxx,1)
                fs.writeFileSync('./settings/premiums.json', JSON.stringify(premiums))
                farrelxd.reply(from, 'Success deleted from premiums!', id)
            } else {
             for (let i = 0; i < mentionedJidList.length; i++) {
                premiums.push(mentionedJidList[i])
                fs.writeFileSync('./settings/premiums.json', JSON.stringify(premiums))
                farrelxd.reply(from, 'Success added to premiums!', id)
                break
                }
            }
        
    }
		// Simi-simi function
		if ((!isCmd && isGroupMsg && isSimi) && message.type === 'chat') {
			axios.get(`https://farrelxdz.herokuapp.com/api/simisimi?kata=${encodeURIComponent(message.body)}&apikey=${apiSimi}`)
			.then((res) => {
				if (res.data.status == 403) return farrelxd.sendText(ownerNumber, `${res.data.result}\n\n${res.data.pesan}`)
				farrelxd.reply(from, `Simi berkata: ${res.data.result}`, id)
			})
			.catch((err) => {
				farrelxd.reply(from, `${err}`, id)
			}) 
		}
		
		// Kata kasar function
		if(!isCmd && isGroupMsg && isNgegas) {
            const find = db.get('group').find({ id: groupId }).value()
            if(find && find.id === groupId){
                const cekuser = db.get('group').filter({id: groupId}).map('members').value()[0]
                const isIn = inArray(pengirim, cekuser)
                if(cekuser && isIn !== false){
                    if(isKasar){
                        const denda = db.get('group').filter({id: groupId}).map('members['+isIn+']').find({ id: pengirim }).update('denda', n => n + 5000).write()
                        if(denda){
                            await farrelxd.reply(from, "Jangan badword bodoh\nDenda +5.000\nTotal : Rp"+formatin(denda.denda), id)
                        }
                    }
                } else {
                    const cekMember = db.get('group').filter({id: groupId}).map('members').value()[0]
                    if(cekMember.length === 0){
                        if(isKasar){
                            db.get('group').find({ id: groupId }).set('members', [{id: pengirim, denda: 5000}]).write()
                        } else {
                            db.get('group').find({ id: groupId }).set('members', [{id: pengirim, denda: 0}]).write()
                        }
                    } else {
                        const cekuser = db.get('group').filter({id: groupId}).map('members').value()[0]
                        if(isKasar){
                            cekuser.push({id: pengirim, denda: 5000})
                            await farrelxd.reply(from, "Jangan badword bodoh\nDenda +5.000", id)
                        } else {
                            cekuser.push({id: pengirim, denda: 0})
                        }
                        db.get('group').find({ id: groupId }).set('members', cekuser).write()
                    }
                }
            } else {
                if(isKasar){
                    db.get('group').push({ id: groupId, members: [{id: pengirim, denda: 5000}] }).write()
                    await farrelxd.reply(from, "Jangan badword bodoh\nDenda +5.000\nTotal : Rp5.000", id)
                } else {
                    db.get('group').push({ id: groupId, members: [{id: pengirim, denda: 0}] }).write()
                }
            }
        }
    } catch (err) {
        console.log(color('[EROR]', 'red'), err)
    }
}
