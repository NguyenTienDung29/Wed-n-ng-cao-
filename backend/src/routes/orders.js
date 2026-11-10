const express=require('express');
const {Product,Cart,Order,Coupon}=require('../models');
const {auth}=require('../middleware/auth');
const {asyncRoute,httpError,clean,isId,priceSummary,money}=require('../utils/core');
const r=express.Router();r.use(auth);
async function quote(user,method,code=''){
 const cart=await Cart.findOne({user}).populate('items.product');
 const selected=(cart?.items||[]).filter(i=>i.selected);
 if(!selected.length)throw httpError(400,'Vui lòng chọn sản phẩm trong giỏ hàng');
 const lines=selected.map(i=>{
  if(!i.product||!i.product.active)throw httpError(400,'Một sản phẩm không còn kinh doanh');
  if(i.quantity>i.product.stock)throw httpError(409,`Không đủ tồn kho: ${i.product.name}`);
  return {product:i.product,price:i.product.price,quantity:i.quantity};
 });
 const subtotal=priceSummary(lines,method).subtotal;
 let coupon=null,discount=0;
 if(code){coupon=await Coupon.findOne({code:clean(code).toUpperCase(),active:true,startAt:{$lte:new Date()},expiresAt:{$gt:new Date()},$expr:{$lt:['$used','$limit']}});
  if(!coupon)throw httpError(400,'Mã giảm giá không hợp lệ hoặc đã hết lượt');
  if(subtotal<coupon.minSpend)throw httpError(400,`Đơn hàng tối thiểu ${coupon.minSpend.toLocaleString('vi-VN')}₫ để dùng mã`);
  discount=coupon.type==='percent'?Math.round(subtotal*coupon.value/100):coupon.value;
  if(coupon.maxDiscount>0)discount=Math.min(discount,coupon.maxDiscount);
 }
 return {lines,summary:priceSummary(lines,method,discount),coupon};
}
function validateAddress(address){
 if(!address||!clean(address.name)||!/^0\d{9}$/.test(clean(address.phone))||!clean(address.line)||!clean(address.city))throw httpError(400,'Tên, số điện thoại 10 số, địa chỉ và tỉnh/thành là bắt buộc');
 return Object.fromEntries(['name','phone','line','ward','district','city'].map(k=>[k,clean(address[k])]));
}
r.post('/quote',asyncRoute(async(req,res)=>{
 const method=req.body.shippingMethod||'standard';if(!['standard','express'].includes(method))throw httpError(400,'Đơn vị vận chuyển không hợp lệ');
 const q=await quote(req.user.id,method,req.body.couponCode);res.json({...q.summary,items:q.lines.map(i=>({name:i.product.name,quantity:i.quantity,price:i.price,stock:i.product.stock})),coupon:q.coupon?.code||null});
}));
r.post('/',asyncRoute(async(req,res)=>{
 const address=validateAddress(req.body.shippingAddress);
 const method=req.body.shippingMethod||'standard';if(!['standard','express'].includes(method))throw httpError(400,'Vận chuyển không hợp lệ');
 if(req.body.paymentMethod&&req.body.paymentMethod!=='COD')throw httpError(400,'Thanh toán online chưa được cấu hình; vui lòng chọn COD');
 const key=clean(req.body.idempotencyKey).slice(0,100);if(key.length<12)throw httpError(400,'Thiếu mã chống gửi đơn trùng lặp');
 const previous=await Order.findOne({user:req.user.id,idempotencyKey:key});if(previous)return res.json(previous);
 const {lines,summary,coupon}=await quote(req.user.id,method,req.body.couponCode);
 const reserved=[];let couponReserved=false;
 try{
  for(const line of lines){
   const result=await Product.findOneAndUpdate({_id:line.product.id,active:true,stock:{$gte:line.quantity}},{$inc:{stock:-line.quantity,sold:line.quantity}},{new:true});
   if(!result)throw httpError(409,`Sản phẩm ${line.product.name} vừa hết hàng. Vui lòng tải lại giỏ.`);
   reserved.push(line);
  }
  if(coupon){const updated=await Coupon.findOneAndUpdate({_id:coupon.id,active:true,used:{$lt:coupon.limit},expiresAt:{$gt:new Date()}},{$inc:{used:1}});
   if(!updated)throw httpError(409,'Mã giảm giá đã hết lượt');couponReserved=true;
  }
  const [order]=await Order.create([{user:req.user.id,idempotencyKey:key,
   items:lines.map(i=>({product:i.product.id,name:i.product.name,slug:i.product.slug,image:i.product.images[0]||'',price:i.price,quantity:i.quantity})),
   shippingAddress:address,shippingMethod:method,paymentMethod:'COD',paymentStatus:'unpaid',status:'pending',
   subtotal:summary.subtotal,shippingFee:summary.shipping,discount:summary.discount,total:summary.total,coupon:coupon?.id||null,notes:clean(req.body.notes)}]);
  const ids=new Set(lines.map(l=>String(l.product.id)));
  await Cart.updateOne({user:req.user.id},{$pull:{items:{product:{$in:[...ids]}}}}).catch(e=>console.error('TECH: đơn đã tạo nhưng không thể dọn giỏ hàng:',e));
  res.status(201).json(order);
 }catch(err){
  for(const line of reserved)await Product.updateOne({_id:line.product.id},{$inc:{stock:line.quantity,sold:-line.quantity}}).catch(console.error);
  if(couponReserved)await Coupon.updateOne({_id:coupon.id},{$inc:{used:-1}}).catch(console.error);
  if(err.code===11000){const existing=await Order.findOne({user:req.user.id,idempotencyKey:key});if(existing)return res.json(existing)}
  throw err;
 }
}));
r.get('/',asyncRoute(async(req,res)=>res.json(await Order.find({user:req.user.id}).sort({createdAt:-1}).lean())));
r.get('/:id',asyncRoute(async(req,res)=>{
 if(!isId(req.params.id))throw httpError(400,'Mã đơn hàng không hợp lệ');
 const order=await Order.findOne({_id:req.params.id,user:req.user.id});if(!order)throw httpError(404,'Không tìm thấy đơn hàng');res.json(order);
}));
r.patch('/:id/cancel',asyncRoute(async(req,res)=>{
 if(!isId(req.params.id))throw httpError(400,'Mã đơn hàng không hợp lệ');
 const order=await Order.findOneAndUpdate({_id:req.params.id,user:req.user.id,status:'pending'},{$set:{status:'cancelled',cancelledAt:new Date()}},{new:true});
 if(!order)throw httpError(409,'Chỉ có thể hủy đơn đang chờ xác nhận');
 await Promise.all(order.items.map(i=>Product.updateOne({_id:i.product},{$inc:{stock:i.quantity,sold:-i.quantity}})));
 if(order.coupon)await Coupon.updateOne({_id:order.coupon},{$inc:{used:-1}});
 res.json(order);
}));
module.exports=r;
