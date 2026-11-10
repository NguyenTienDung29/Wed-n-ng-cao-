const express=require('express');
const {Product,Category,Brand,Banner,Review,Order}=require('../models');
const {auth}=require('../middleware/auth');
const {httpError,asyncRoute,clean,isId,money,slug}=require('../utils/core');
const r=express.Router();
const pop=q=>q.populate('category','name slug').populate('brand','name slug');
r.get('/categories',asyncRoute(async(req,res)=>res.json(await Category.find().sort({name:1}))));
r.get('/brands',asyncRoute(async(req,res)=>res.json(await Brand.find().sort({name:1}))));
r.get('/banners',asyncRoute(async(req,res)=>res.json(await Banner.find({active:true}).sort({sort:1}))));
r.get('/products',asyncRoute(async(req,res)=>{
 const q={active:true};
 const keyword=clean(req.query.q).slice(0,80);if(keyword){const escaped=keyword.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');q.name={$regex:escaped,$options:'i'};}
 if(req.query.category){const cat=await Category.findOne({slug:clean(req.query.category)});if(!cat)return res.json({items:[],total:0,page:1,pages:0});q.category=cat.id;}
 if(req.query.brand){const brand=await Brand.findOne({slug:clean(req.query.brand)});if(!brand)return res.json({items:[],total:0,page:1,pages:0});q.brand=brand.id;}
 if(req.query.minPrice!==undefined||req.query.maxPrice!==undefined){q.price={};if(req.query.minPrice!==undefined)q.price.$gte=money(req.query.minPrice);if(req.query.maxPrice!==undefined)q.price.$lte=money(req.query.maxPrice);}
 if(req.query.featured==='true')q.featured=true;
 if(req.query.badge&&['hot','new','sale'].includes(req.query.badge))q.badge=req.query.badge;
 const page=Math.min(1000,Math.max(1,parseInt(req.query.page,10)||1));const limit=Math.min(48,Math.max(1,parseInt(req.query.limit,10)||12));
 const sorts={newest:{createdAt:-1},price_asc:{price:1},price_desc:{price:-1},popular:{sold:-1},rating:{rating:-1}};
 const sort=sorts[req.query.sort]||sorts.newest;
 const [total,items]=await Promise.all([Product.countDocuments(q),pop(Product.find(q).sort(sort).skip((page-1)*limit).limit(limit).lean())]);
 res.json({items,total,page,pages:Math.ceil(total/limit),limit});
}));
r.get('/products/:slug',asyncRoute(async(req,res)=>{
 const product=await pop(Product.findOne({slug:req.params.slug,active:true}));if(!product)throw httpError(404,'Sản phẩm không tồn tại');
 const related=await pop(Product.find({_id:{$ne:product.id},category:product.category._id,active:true}).limit(6).lean());
 res.json({product,related});
}));
r.get('/products/:slug/reviews',asyncRoute(async(req,res)=>{
 const product=await Product.findOne({slug:req.params.slug,active:true});if(!product)throw httpError(404,'Không tìm thấy sản phẩm');
 const items=await Review.find({product:product.id}).populate('user','name').sort({createdAt:-1}).limit(60).lean();res.json(items);
}));
r.post('/products/:slug/reviews',auth,asyncRoute(async(req,res)=>{
 const product=await Product.findOne({slug:req.params.slug,active:true});if(!product)throw httpError(404,'Không tìm thấy sản phẩm');
 const rating=Number(req.body.rating),comment=clean(req.body.comment);
 if(!Number.isInteger(rating)||rating<1||rating>5||comment.length<8)throw httpError(400,'Chấm 1–5 sao và nhận xét ít nhất 8 ký tự');
 const bought=await Order.exists({user:req.user.id,status:'delivered','items.product':product.id});
 if(!bought)throw httpError(403,'Chỉ người đã nhận sản phẩm mới được đánh giá');
 const review=await Review.findOneAndUpdate({user:req.user.id,product:product.id},{$set:{rating,comment}},{upsert:true,new:true,runValidators:true});
 const ratings=await Review.aggregate([{$match:{product:product._id}},{$group:{_id:null,avg:{$avg:'$rating'},count:{$sum:1}}}]);
 await Product.updateOne({_id:product.id},{$set:{rating:Math.round((ratings[0]?.avg||0)*10)/10,reviewCount:ratings[0]?.count||0}});
 res.status(201).json(review);
}));
module.exports=r;
