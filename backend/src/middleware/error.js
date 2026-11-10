const {httpError}=require('../utils/core');
const notFound=(req,res,next)=>next(httpError(404,'Không tìm thấy API'));
const handler=(err,req,res,next)=>{
 const status=err.status || (err.name==='ValidationError'?400:err.name==='MulterError'?400:err.name==='CastError'?400:err.code===11000?409:500);
 const message=err.code===11000?'Dữ liệu đã tồn tại':err.name==='CastError'?'Mã không hợp lệ':(status===500 && process.env.NODE_ENV==='production'?'Lỗi hệ thống':err.message);
 if(status>=500)console.error('[TECH]',err);
 res.status(status).json({success:false,message});
};
module.exports={notFound,handler};
