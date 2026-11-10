const jwt=require('jsonwebtoken');
const {User}=require('../models');
const {httpError,asyncRoute}=require('../utils/core');
const secret=()=>{if(!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET phải có ít nhất 32 ký tự');return process.env.JWT_SECRET};
const sign=user=>jwt.sign({sub:user.id,role:user.role},secret(),{expiresIn:process.env.JWT_EXPIRES_IN||'7d'});
const auth=asyncRoute(async(req,res,next)=>{
 const header=req.get('Authorization')||'';
 if(!header.startsWith('Bearer ')) throw httpError(401,'Vui lòng đăng nhập');
 let data;try{data=jwt.verify(header.slice(7),secret());}catch{throw httpError(401,'Phiên đăng nhập không hợp lệ hoặc đã hết hạn')}
 const user=await User.findById(data.sub);
 if(!user||user.locked) throw httpError(401,'Tài khoản không khả dụng');
 req.user=user;next();
});
const admin=(req,res,next)=>req.user?.role==='admin'?next():next(httpError(403,'Bạn không có quyền quản trị'));
module.exports={auth,admin,sign};
