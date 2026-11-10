async function sendReset(email,url){
 if(!process.env.SMTP_HOST) return false;
 const nodemailer=require('nodemailer');
 const transport=nodemailer.createTransport({host:process.env.SMTP_HOST,port:Number(process.env.SMTP_PORT||587),secure:Number(process.env.SMTP_PORT)===465,auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS}});
 await transport.sendMail({from:process.env.SMTP_FROM||process.env.SMTP_USER,to:email,subject:'TECH - Đặt lại mật khẩu',text:`Mở liên kết để đặt lại mật khẩu (có hiệu lực 15 phút): ${url}`});
 return true;
}
module.exports={sendReset};
