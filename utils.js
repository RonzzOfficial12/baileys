exports.getBody = (msg) => {
if(!msg.message) return ""

if(msg.message.conversation)
return msg.message.conversation

if(msg.message.extendedTextMessage)
return msg.message.extendedTextMessage.text

return ""
}
