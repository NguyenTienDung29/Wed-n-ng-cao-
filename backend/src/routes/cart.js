const express=require('express');
const {Product,Cart}=require('../models');
const {auth}=require('../middleware/auth');
const {httpError,asyncRoute,isId}=require('../utils/core');
const r=express.Router();r.use(auth);
const get=async user=>{let c=await Cart.findOne({user});if(!c)c=await Cart.create({user,items:[]});return c};
const send=async(res,user)=>{const cart=await Cart.findOne({user}).populate({path:'items.product',populate:[{path:'category',select:'name slug'},{path:'brand',select:'name slug'}]});res.json(cart||{items:[]});};
r.get('/',asyncRoute(async(req,res)=>send(res,req.user.id)));
r.post('/items',asyncRoute(async(req,res)=>{
 const id=req.body.productId,qty=Number(req.body.quantity||1);
 if(!isId(id)||!Number.isInteger(qty)||qty<1||qty>99)throw httpError(400,'Sản phẩm hoặc số lượng không hợp lệ');
 const product=await Product.findOne({_id:id,active:true});if(!product)throw httpError(404,'Không tìm thấy sản phẩm');
 const cart=await get(req.user.id);const existing=cart.items.find(i=>String(i.product)===String(id));const target=(existing?.quantity||0)+qty;
 if(target>product.stock)throw httpError(400,'Số lượng vượt quá tồn kho');
 if(existing){existing.quantity=target;existing.selected=true}else cart.items.push({product:id,quantity:qty,selected:true});
 await cart.save();await send(res,req.user.id);
}));
r.put('/items/:id',asyncRoute(async(req,res)=>{
 const qty=Number(req.body.quantity);if(!isId(req.params.id))throw httpError(400,'Mã không hợp lệ');
 if(!Number.isInteger(qty)||qty<0||qty>99)throw httpError(400,'Số lượng không hợp lệ');
 const cart=await get(req.user.id);const i=cart.items.find(i=>String(i.product)===req.params.id);if(!i)throw httpError(404,'Không có sản phẩm trong giỏ');
 if(qty===0)cart.items=cart.items.filter(i=>String(i.product)!==req.params.id);
 else {const product=await Product.findById(req.params.id);if(!product||qty>product.stock)throw httpError(400,'Không đủ tồn kho');i.quantity=qty;}
 await cart.save();await send(res,req.user.id);
}));
r.patch('/items/:id',asyncRoute(async(req,res)=>{
 const cart=await get(req.user.id);const i=cart.items.find(i=>String(i.product)===req.params.id);if(!i)throw httpError(404,'Không có sản phẩm trong giỏ');
 if(typeof req.body.selected!=='boolean')throw httpError(400,'Giá trị selected phải là boolean');i.selected=req.body.selected;await cart.save();await send(res,req.user.id);
}));
r.delete('/items/:id',asyncRoute(async(req,res)=>{const cart=await get(req.user.id);cart.items=cart.items.filter(i=>String(i.product)!==req.params.id);await cart.save();await send(res,req.user.id);}));
module.exports=r;
