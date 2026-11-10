const mongoose = require('mongoose');
const {Schema, model} = mongoose;
const opts = {timestamps:true};
const User = model('User', new Schema({
  name:{type:String,required:true,trim:true,maxlength:100},
  email:{type:String,required:true,lowercase:true,trim:true,unique:true,index:true},
  phone:{type:String,trim:true,default:''}, passwordHash:{type:String,required:true,select:false},
  role:{type:String,enum:['user','admin'],default:'user'}, locked:{type:Boolean,default:false},
  resetTokenHash:{type:String,select:false}, resetTokenExpires:{type:Date,select:false}
}, opts));
const Category = model('Category',new Schema({name:{type:String,required:true,unique:true},slug:{type:String,required:true,unique:true},icon:{type:String,default:'grid-2x2'},image:{type:String,default:''}},opts));
const Brand = model('Brand',new Schema({name:{type:String,required:true,unique:true},slug:{type:String,required:true,unique:true},logo:{type:String,default:''}},opts));
const productSchema = new Schema({
  name:{type:String,required:true,maxlength:180},slug:{type:String,unique:true,required:true},
  description:{type:String,default:''},shortDescription:{type:String,default:''},
  price:{type:Number,required:true,min:0},originalPrice:{type:Number,min:0,default:0},
  stock:{type:Number,required:true,min:0,default:0},sold:{type:Number,min:0,default:0},
  category:{type:Schema.Types.ObjectId,ref:'Category',required:true,index:true},
  brand:{type:Schema.Types.ObjectId,ref:'Brand',required:true,index:true},
  images:{type:[String],default:[]},tags:{type:[String],default:[]},featured:{type:Boolean,default:false},
  badge:{type:String,enum:['','new','hot','sale'],default:''},
  rating:{type:Number,min:0,max:5,default:0},reviewCount:{type:Number,min:0,default:0},
  active:{type:Boolean,default:true,index:true}, specs:{type:Map,of:String,default:{}}
},opts);
productSchema.index({name:'text',description:'text',tags:'text'});
productSchema.index({createdAt:-1});
const Product=model('Product',productSchema);
const cartLine = new Schema({product:{type:Schema.Types.ObjectId,ref:'Product',required:true},quantity:{type:Number,min:1,max:99,required:true},selected:{type:Boolean,default:true}},{_id:false});
const Cart=model('Cart',new Schema({user:{type:Schema.Types.ObjectId,ref:'User',unique:true,required:true},items:{type:[cartLine],default:[]}},opts));
const addressSchema=new Schema({user:{type:Schema.Types.ObjectId,ref:'User',required:true,index:true},name:{type:String,required:true},phone:{type:String,required:true},line:{type:String,required:true},ward:String,district:String,city:{type:String,required:true},isDefault:{type:Boolean,default:false}},opts);
const Address=model('Address',addressSchema);
const orderItem=new Schema({product:{type:Schema.Types.ObjectId,ref:'Product',required:true},name:String,slug:String,image:String,price:Number,quantity:Number},{_id:false});
const Order=model('Order',new Schema({
  user:{type:Schema.Types.ObjectId,ref:'User',required:true,index:true},items:{type:[orderItem],required:true},
  shippingAddress:{name:String,phone:String,line:String,ward:String,district:String,city:String},
  shippingMethod:{type:String,enum:['standard','express'],default:'standard'},
  paymentMethod:{type:String,enum:['COD'],default:'COD'},paymentStatus:{type:String,enum:['unpaid','paid','refunded'],default:'unpaid'},
  status:{type:String,enum:['pending','confirmed','shipping','delivered','cancelled'],default:'pending',index:true},
  subtotal:Number,shippingFee:Number,discount:Number,total:Number,
  coupon:{type:Schema.Types.ObjectId,ref:'Coupon',default:null},
  idempotencyKey:{type:String},notes:{type:String,maxlength:500,default:''},
  cancelledAt:Date,deliveredAt:Date
},opts));
Order.schema.index({user:1,idempotencyKey:1},{unique:true,partialFilterExpression:{idempotencyKey:{$type:'string'}}});
const Review=model('Review',new Schema({user:{type:Schema.Types.ObjectId,ref:'User',required:true},product:{type:Schema.Types.ObjectId,ref:'Product',required:true,index:true},rating:{type:Number,min:1,max:5,required:true},comment:{type:String,required:true,maxlength:1200}},opts));
Review.schema.index({user:1,product:1},{unique:true});
const Coupon=model('Coupon',new Schema({code:{type:String,required:true,unique:true,uppercase:true,trim:true},type:{type:String,enum:['fixed','percent'],required:true},value:{type:Number,required:true,min:0},minSpend:{type:Number,default:0,min:0},maxDiscount:{type:Number,default:0},limit:{type:Number,default:100,min:1},used:{type:Number,default:0,min:0},startAt:{type:Date,default:Date.now},expiresAt:{type:Date,required:true},active:{type:Boolean,default:true}},opts));
const Banner=model('Banner',new Schema({title:{type:String,required:true},subtitle:String,image:String,href:{type:String,default:'/san-pham'},active:{type:Boolean,default:true},sort:{type:Number,default:0}},opts));
module.exports={User,Category,Brand,Product,Cart,Address,Order,Review,Coupon,Banner};
