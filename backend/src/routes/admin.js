const express=require('express');
const multer=require('multer');const path=require('node:path');const crypto=require('node:crypto');
const {User,Product,Category,Brand,Order,Coupon,Review,Banner,Cart}=require('../models');
const {auth,admin}=require('../middleware/auth');
const {asyncRoute,httpError,clean,slug,isId,money}=require('../utils/core');
const r=express.Router();r.use(auth,admin);
const storage=multer.diskStorage({destination:path.resolve(__dirname,'../../uploads'),filename:(req,file,cb)=>cb(null,crypto.randomBytes(10).toString('hex')+({ 'image/jpeg':'.jpg','image/png':'.png','image/webp':'.webp','image/avif':'.avif'}[file.mimetype]||'.bin'))});
const upload=multer({storage,limits:{fileSize:3*1024*1024,files:8},fileFilter:(req,file,cb)=>['image/jpeg','image/png','image/webp','image/avif'].includes(file.mimetype)?cb(null,true):cb(httpError(400,'Chỉ cho phép PNG, JPG, WebP, AVIF'))});
r.post('/uploads',upload.array('images',8),(req,res)=>res.status(201).json({urls:(req.files||[]).map(f=>`/uploads/${f.filename}`)}));
r.get('/dashboard',asyncRoute(async(req,res)=>{
 const [revenue,orders,customers,products,recent,lowStock,top,monthly]=await Promise.all([
  Order.aggregate([{$match:{status:'delivered'}},{$group:{_id:null,total:{$sum:'$total'}}}]),
  Order.countDocuments(),User.countDocuments({role:'user'}),Product.countDocuments({active:true}),
  Order.find().sort({createdAt:-1}).limit(7).populate('user','name').lean(),
  Product.find({active:true,stock:{$lte:8}}).sort({stock:1}).limit(8).lean(),
  Product.find({active:true}).sort({sold:-1}).limit(5).lean(),
  Order.aggregate([{$match:{status:'delivered'}},{$group:{_id:{$dateToString:{format:'%Y-%m',date:'$createdAt'}},revenue:{$sum:'$total'}}},{$sort:{_id:1}},{$limit:12}])
 ]);
 res.json({revenue:revenue[0]?.total||0,orders,customers,products,recent,lowStock,top,monthly});
}));
r.get('/products',asyncRoute(async(req,res)=>{
 const q={};if(req.query.q)q.name={$regex:clean(req.query.q).replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),$options:'i'};
 const page=Math.max(1,Number(req.query.page)||1),limit=20;
 const [items,total]=await Promise.all([Product.find(q).populate('category','name').populate('brand','name').sort({createdAt:-1}).skip((page-1)*limit).limit(limit).lean(),Product.countDocuments(q)]);
 res.json({items,total,pages:Math.ceil(total/limit),page});
}));
const productInput=async body=>{
 const name=clean(body.name),description=String(body.description||'').slice(0,8000),price=money(body.price),originalPrice=money(body.originalPrice),stock=Number(body.stock),category=body.category,brand=body.brand;
 if(name.length<5||!isId(category)||!isId(brand)||!Number.isInteger(stock)||stock<0||!Number.isFinite(Number(body.price))||Number(body.price)<0)throw httpError(400,'Tên, giá, tồn kho, danh mục hoặc thương hiệu không hợp lệ');
 const found=await Promise.all([Category.exists({_id:category}),Brand.exists({_id:brand})]);if(!found[0]||!found[1])throw httpError(400,'Danh mục hoặc thương hiệu không tồn tại');
 const images=Array.isArray(body.images)?body.images.filter(v=>typeof v==='string'&&(v.startsWith('/uploads/')||v.startsWith('/products/')||v.startsWith('https://'))).slice(0,8):[];
 const badge=['new','hot','sale',''].includes(body.badge)?body.badge:'';
 const tags=Array.isArray(body.tags)?body.tags.map(t=>clean(t)).slice(0,12):[];
 const specs=(body.specs&&typeof body.specs==='object'&&!Array.isArray(body.specs))?Object.fromEntries(Object.entries(body.specs).slice(0,20).map(([k,v])=>[clean(k),clean(v)])):{ };
 return {name,description,shortDescription:clean(body.shortDescription),price,originalPrice,stock,category,brand,images,badge,tags,specs,featured:!!body.featured,active:body.active!==false};
};
r.post('/products',asyncRoute(async(req,res)=>{
 const fields=await productInput(req.body),base=slug(fields.name);let s=base,i=1;
 while(await Product.exists({slug:s}))s=`${base}-${++i}`;
 const p=await Product.create({...fields,slug:s});res.status(201).json(p);
}));
r.put('/products/:id',asyncRoute(async(req,res)=>{
 if(!isId(req.params.id))throw httpError(400,'Mã không hợp lệ');
 const p=await Product.findById(req.params.id);if(!p)throw httpError(404,'Không tìm thấy sản phẩm');
 const fields=await productInput(req.body);Object.assign(p,fields);await p.save();res.json(p);
}));
r.delete('/products/:id',asyncRoute(async(req,res)=>{const p=await Product.findByIdAndUpdate(req.params.id,{$set:{active:false}},{new:true});if(!p)throw httpError(404,'Sản phẩm không tồn tại');res.json({message:'Đã ẩn sản phẩm (giữ dữ liệu lịch sử đơn hàng)'});}));
r.get('/orders',asyncRoute(async(req,res)=>{
 const q=req.query.status?{status:req.query.status}:{};
 res.json(await Order.find(q).populate('user','name email').sort({createdAt:-1}).limit(250).lean());
}));
r.patch('/orders/:id/status',asyncRoute(async(req,res)=>{
 if(!isId(req.params.id))throw httpError(400,'Mã không hợp lệ');
 const next=clean(req.body.status),transitions={pending:['confirmed','cancelled'],confirmed:['shipping','cancelled'],shipping:['delivered'],delivered:[],cancelled:[]};
 const current=await Order.findById(req.params.id);if(!current)throw httpError(404,'Không tìm thấy đơn hàng');
 if(!transitions[current.status].includes(next))throw httpError(409,'Chuyển trạng thái không hợp lệ');
 const updated=await Order.findOneAndUpdate({_id:current.id,status:current.status},{$set:{status:next,...(next==='delivered'?{deliveredAt:new Date(),paymentStatus:'paid'}:{}),...(next==='cancelled'?{cancelledAt:new Date()}: {})}},{new:true});
 if(!updated)throw httpError(409,'Đơn hàng vừa được cập nhật bởi người khác');
 if(next==='cancelled'){await Promise.all(updated.items.map(i=>Product.updateOne({_id:i.product},{$inc:{stock:i.quantity,sold:-i.quantity}})));if(updated.coupon)await Coupon.updateOne({_id:updated.coupon},{$inc:{used:-1}});}
 res.json(updated);
}));
r.get('/users',asyncRoute(async(req,res)=>{
 const query=req.query.q?{email:{$regex:clean(req.query.q).replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),$options:'i'}}:{};
 res.json(await User.find(query).select('-passwordHash -resetTokenHash -resetTokenExpires').sort({createdAt:-1}).limit(200));
}));
r.patch('/users/:id',asyncRoute(async(req,res)=>{
 if(!isId(req.params.id))throw httpError(400,'Mã không hợp lệ');
 const fields={};if(req.body.role!==undefined){if(!['user','admin'].includes(req.body.role))throw httpError(400,'Vai trò không hợp lệ');fields.role=req.body.role}
 if(req.body.locked!==undefined){if(typeof req.body.locked!=='boolean')throw httpError(400,'Trạng thái khóa không hợp lệ');fields.locked=req.body.locked}
 if(req.params.id===req.user.id&&(fields.locked||fields.role==='user'))throw httpError(400,'Không thể khóa hoặc hạ quyền chính mình');
 const u=await User.findByIdAndUpdate(req.params.id,{$set:fields},{new:true,runValidators:true}).select('-passwordHash');if(!u)throw httpError(404,'Không có tài khoản');res.json(u);
}));
for(const [segment,Model] of [['categories',Category],['brands',Brand]]){
 r.get(`/${segment}`,asyncRoute(async(req,res)=>res.json(await Model.find().sort({name:1}))));
 r.post(`/${segment}`,asyncRoute(async(req,res)=>{const name=clean(req.body.name);if(name.length<2)throw httpError(400,'Tên không hợp lệ');const doc=await Model.create({name,slug:slug(name),...(segment==='categories'?{icon:clean(req.body.icon)||'grid-2x2'}:{})});res.status(201).json(doc)}));
 r.put(`/${segment}/:id`,asyncRoute(async(req,res)=>{const name=clean(req.body.name);if(name.length<2)throw httpError(400,'Tên không hợp lệ');const doc=await Model.findByIdAndUpdate(req.params.id,{$set:{name,slug:slug(name)}},{new:true,runValidators:true});if(!doc)throw httpError(404,'Không tìm thấy');res.json(doc)}));
 r.delete(`/${segment}/:id`,asyncRoute(async(req,res)=>{const count=await Product.countDocuments({[segment==='categories'?'category':'brand']:req.params.id});if(count)throw httpError(409,'Không thể xóa khi còn sản phẩm sử dụng');await Model.findByIdAndDelete(req.params.id);res.json({message:'Đã xóa'})}));
}
r.get('/coupons',asyncRoute(async(req,res)=>res.json(await Coupon.find().sort({createdAt:-1}))));
r.post('/coupons',asyncRoute(async(req,res)=>{
 const {code,type,value,minSpend,maxDiscount,limit,expiresAt,startAt,active}=req.body;
 if(!/^[A-Z0-9_-]{3,20}$/.test(clean(code).toUpperCase())||!['fixed','percent'].includes(type)||Number(value)<=0||type==='percent'&&Number(value)>100||!Number.isFinite(Date.parse(expiresAt)))throw httpError(400,'Dữ liệu mã giảm giá không hợp lệ');
 const coupon=await Coupon.create({code:clean(code).toUpperCase(),type,value:money(value),minSpend:money(minSpend),maxDiscount:money(maxDiscount),limit:Math.max(1,Number(limit)||100),expiresAt,startAt:startAt||new Date(),active:active!==false});res.status(201).json(coupon);
}));
r.put('/coupons/:id',asyncRoute(async(req,res)=>{const fields={};for(const k of ['type','value','minSpend','maxDiscount','limit','expiresAt','startAt','active'])if(req.body[k]!==undefined)fields[k]=req.body[k];const updated=await Coupon.findByIdAndUpdate(req.params.id,{$set:fields},{new:true,runValidators:true});if(!updated)throw httpError(404,'Không có mã');res.json(updated)}));
r.delete('/coupons/:id',asyncRoute(async(req,res)=>{await Coupon.findByIdAndDelete(req.params.id);res.json({message:'Đã xóa'})}));
r.get('/banners',asyncRoute(async(req,res)=>res.json(await Banner.find().sort({sort:1}))));
r.post('/banners',asyncRoute(async(req,res)=>{if(!clean(req.body.title))throw httpError(400,'Thiếu tiêu đề');res.status(201).json(await Banner.create({title:clean(req.body.title),subtitle:clean(req.body.subtitle),image:clean(req.body.image),href:clean(req.body.href)||'/san-pham',sort:Number(req.body.sort)||0,active:req.body.active!==false}))}));
r.put('/banners/:id',asyncRoute(async(req,res)=>{const fields={};for(const k of ['title','subtitle','image','href','sort','active'])if(req.body[k]!==undefined)fields[k]=req.body[k];const updated=await Banner.findByIdAndUpdate(req.params.id,{$set:fields},{new:true,runValidators:true});res.json(updated)}));
r.delete('/banners/:id',asyncRoute(async(req,res)=>{await Banner.findByIdAndDelete(req.params.id);res.json({message:'Đã xóa'})}));
module.exports=r;
