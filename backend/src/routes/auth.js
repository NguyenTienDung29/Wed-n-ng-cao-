const express=require('express');
const bcrypt=require('bcryptjs');
const crypto=require('node:crypto');
const rateLimit=require('express-rate-limit');
const {User,Address}=require('../models');
const {auth,sign}=require('../middleware/auth');
const {asyncRoute,httpError,clean,validEmail,tokenHash,isId}=require('../utils/core');
const {sendReset}=require('../utils/mailer');
const r=express.Router();
const limited=rateLimit({windowMs:15*60*1000,limit:20,standardHeaders:'draft-7',legacyHeaders:false,message:{message:'Quá nhiều lần thử, vui lòng quay lại sau 15 phút'}});
const publicUser=u=>({id:u.id,name:u.name,email:u.email,phone:u.phone,role:u.role,locked:u.locked});
r.post('/register',limited,asyncRoute(async(req,res)=>{
 const name=clean(req.body.name),email=clean(req.body.email).toLowerCase(),password=String(req.body.password||''),phone=clean(req.body.phone);
 if(name.length<2||!validEmail(email)||password.length<8)throw httpError(400,'Tên tối thiểu 2 ký tự, email hợp lệ và mật khẩu tối thiểu 8 ký tự');
 if(await User.exists({email}))throw httpError(409,'Email đã được sử dụng');
 const user=await User.create({name,email,phone,passwordHash:await bcrypt.hash(password,12)});
 res.status(201).json({user:publicUser(user),token:sign(user)});
}));
r.post('/login',limited,asyncRoute(async(req,res)=>{
 const email=clean(req.body.email).toLowerCase();
 const user=await User.findOne({email}).select('+passwordHash');
 if(!user||!(await bcrypt.compare(String(req.body.password||''),user.passwordHash)))throw httpError(401,'Email hoặc mật khẩu không đúng');
 if(user.locked)throw httpError(403,'Tài khoản đã bị khóa');
 res.json({user:publicUser(user),token:sign(user)});
}));
r.post('/forgot-password',limited,asyncRoute(async(req,res)=>{
 const email=clean(req.body.email).toLowerCase();const user=await User.findOne({email}).select('+resetTokenHash +resetTokenExpires');
 let devResetUrl;
 if(user){const token=crypto.randomBytes(32).toString('hex');user.resetTokenHash=tokenHash(token);user.resetTokenExpires=new Date(Date.now()+15*60*1000);await user.save();const url=`${process.env.FRONTEND_URL||'http://localhost:5173'}/dat-lai-mat-khau/${token}`;const sent=await sendReset(email,url);if(!sent&&process.env.NODE_ENV!=='production'&&process.env.DEV_SHOW_RESET_LINK==='true')devResetUrl=url;}
 res.json({message:'Nếu email tồn tại, hướng dẫn đặt lại mật khẩu sẽ được gửi.',...(devResetUrl?{devResetUrl}:{})});
}));
r.post('/reset-password',limited,asyncRoute(async(req,res)=>{
 const token=String(req.body.token||''),password=String(req.body.password||'');
 if(password.length<8||!token)throw httpError(400,'Token và mật khẩu tối thiểu 8 ký tự là bắt buộc');
 const user=await User.findOne({resetTokenHash:tokenHash(token),resetTokenExpires:{$gt:new Date()}}).select('+resetTokenHash +resetTokenExpires');
 if(!user)throw httpError(400,'Liên kết đã hết hạn hoặc không hợp lệ');
 user.passwordHash=await bcrypt.hash(password,12);user.resetTokenHash=undefined;user.resetTokenExpires=undefined;await user.save();res.json({message:'Đã cập nhật mật khẩu'});
}));
r.get('/me',auth,(req,res)=>res.json({user:publicUser(req.user)}));
r.put('/me',auth,asyncRoute(async(req,res)=>{
 const {name,phone}=req.body;
 if(name!==undefined){if(clean(name).length<2)throw httpError(400,'Tên không hợp lệ');req.user.name=clean(name)}
 if(phone!==undefined)req.user.phone=clean(phone);
 await req.user.save();res.json({user:publicUser(req.user)});
}));
r.put('/password',auth,asyncRoute(async(req,res)=>{
 const user=await User.findById(req.user.id).select('+passwordHash');
 if(!(await bcrypt.compare(String(req.body.currentPassword||''),user.passwordHash)))throw httpError(400,'Mật khẩu hiện tại không đúng');
 if(String(req.body.newPassword||'').length<8)throw httpError(400,'Mật khẩu mới phải có tối thiểu 8 ký tự');
 user.passwordHash=await bcrypt.hash(String(req.body.newPassword),12);await user.save();res.json({message:'Đổi mật khẩu thành công'});
}));
r.get('/addresses',auth,asyncRoute(async(req,res)=>res.json(await Address.find({user:req.user.id}).sort({isDefault:-1,createdAt:-1}))));
r.post('/addresses',auth,asyncRoute(async(req,res)=>{
 const {name,phone,line,ward,district,city,isDefault}=req.body;
 if(!clean(name)||!/^0\d{9}$/.test(clean(phone))||!clean(line)||!clean(city))throw httpError(400,'Vui lòng điền người nhận, số điện thoại 10 số, địa chỉ và tỉnh/thành');
 if(isDefault)await Address.updateMany({user:req.user.id},{$set:{isDefault:false}});
 const a=await Address.create({user:req.user.id,name:clean(name),phone:clean(phone),line:clean(line),ward:clean(ward),district:clean(district),city:clean(city),isDefault:!!isDefault});res.status(201).json(a);
}));
r.put('/addresses/:id',auth,asyncRoute(async(req,res)=>{
 if(!isId(req.params.id))throw httpError(400,'Mã không hợp lệ');
 const existing=await Address.findOne({_id:req.params.id,user:req.user.id});if(!existing)throw httpError(404,'Không tìm thấy địa chỉ');
 const a={};for(const k of ['name','phone','line','ward','district','city'])if(req.body[k]!==undefined)a[k]=clean(req.body[k]);
 if(a.phone&&!/^0\d{9}$/.test(a.phone))throw httpError(400,'Số điện thoại không hợp lệ');
 if(req.body.isDefault){await Address.updateMany({user:req.user.id},{$set:{isDefault:false}});a.isDefault=true;}
 const updated=await Address.findByIdAndUpdate(existing.id,{$set:a},{new:true,runValidators:true});res.json(updated);
}));
r.delete('/addresses/:id',auth,asyncRoute(async(req,res)=>{await Address.deleteOne({_id:req.params.id,user:req.user.id});res.json({message:'Đã xóa địa chỉ'});}));
module.exports=r;
