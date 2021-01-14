const { create, Client } = require('@open-wa/wa-automate')
const figlet = require('figlet')
const options = require('./utils/options')
const { color, messageLog } = require('./utils')
const HandleMsg = require('./HandleMsg')

const start = (farrelxd = new Client()) => {
    console.log(color(figlet.textSync('----------------', { horizontalLayout: 'default' })))
    console.log(color(figlet.textSync('LMAO BOT', { font: 'Ghost', horizontalLayout: 'default' })))
    console.log(color(figlet.textSync('----------------', { horizontalLayout: 'default' })))
    console.log(color('[DEV]'), color('Farrel', 'yellow'))
    console.log(color('[~>>]'), color('BOT Started!', 'green'))

    // Mempertahankan sesi agar tetap nyala
    farrelxd.onStateChanged((state) => {
        console.log(color('[~>>]', 'red'), state)
        if (state === 'CONFLICT' || state === 'UNLAUNCHED') farrelxd.forceRefocus()
    })

    // ketika bot diinvite ke dalam group
    farrelxd.onAddedToGroup(async (chat) => {
	const groups = await farrelxd.getAllGroups()
	// kondisi ketika batas group bot telah tercapai,ubah di file settings/setting.json
	if (groups.length > groupLimit) {
	await farrelxd.sendText(chat.id, `Sorry, the group on this bot is full\nMax Group is: ${groupLimit}`).then(() => {
	      farrelxd.leaveGroup(chat.id)
	      farrelxd.deleteChat(chat.id)
	  }) 
	} else {
	// kondisi ketika batas member group belum tercapai, ubah di file settings/setting.json
	    if (chat.groupMetadata.participants.length < memberLimit) {
	    await farrelxd.sendText(chat.id, `Sorry, BOT comes out if the group members do not exceed ${memberLimit} people`).then(() => {
	      farrelxd.leaveGroup(chat.id)
	      farrelxd.deleteChat(chat.id)
	    })
	    } else {
        await farrelxd.simulateTyping(chat.id, true).then(async () => {
          await farrelxd.sendText(chat.id, `Hai minna~, Im LMAO BOT. To find out the commands on this bot type ${prefix}menu`)
        })
	    }
	}
    })

    // ketika seseorang masuk/keluar dari group
    farrelxd.onGlobalParicipantsChanged(async (event) => {
        const host = await farrelxd.getHostNumber() + '@c.us'
		let profile = await farrelxd.getProfilePicFromServer(event.who)
		if (profile == '' || profile == undefined) profile = 'https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcTQcODjk7AcA4wb_9OLzoeAdpGwmkJqOYxEBA&usqp=CAU'
        // kondisi ketika seseorang diinvite/join group lewat link
        if (event.action === 'add' && event.who !== host) {
			await farrelxd.sendFileFromUrl(event.chat, profile, 'profile.jpg', '')
            await farrelxd.sendTextWithMentions(event.chat, `Hallo, Selamat Datang Di Grup Kami @${event.who.replace('@c.us', '')} \n\nJangan nakal ya beb :')✨`)
        }
        // kondisi ketika seseorang dikick/keluar dari group
        if (event.action === 'remove' && event.who !== host) {
			await farrelxd.sendFileFromUrl(event.chat, profile, 'profile.jpg', '')
            await farrelxd.sendTextWithMentions(event.chat, `Selamat Tinggal @${event.who.replace('@c.us', '')}, Miss You Beb✨`)
        }
    })

    farrelxd.onIncomingCall(async (callData) => {
        // ketika seseorang menelpon nomor bot akan mengirim pesan
        await farrelxd.sendText(callData.peerJid, 'Maaf sedang tidak bisa menerima panggilan.\n\n-bot')
        .then(async () => {
            // bot akan memblock nomor itu
            await farrelxd.contactBlock(callData.peerJid)
        })
    })

    // ketika seseorang mengirim pesan
    farrelxd.onMessage(async (message) => {
        farrelxd.getAmountOfLoadedMessages() // menghapus pesan cache jika sudah 3000 pesan.
            .then((msg) => {
                if (msg >= 3000) {
                    console.log('[Farrel]', color(`Loaded Message Reach ${msg}, cuting message cache...`, 'yellow'))
                    farrelxd.cutMsgCache()
                }
            })
        HandleMsg(farrelxd, message)    
    
    })
	
    // Message log for analytic
    farrelxd.onAnyMessage((anal) => { 
        messageLog(anal.fromMe, anal.type)
    })
}

//create session
create(options(true, start))
    .then((farrelxd) => start(farrelxd))
    .catch((err) => new Error(err))
