require('dotenv').config();
const mongoose=require('mongoose'),bcrypt=require('bcryptjs');
const {slug}=require('./utils/core');
const {User,Category,Brand,Product,Cart,Order,Review,Coupon,Banner,Address}=require('./models');
if(process.env.NODE_ENV==='production'){console.error('Không cho phép seed ở production');process.exit(1)}
const categories=[
 ['Tai nghe','headphones','Headphones'],['Sạc & củ sạc','charger','Zap'],['Cáp kết nối','cable','Cable'],['Sạc dự phòng','powerbank','BatteryCharging'],['Ốp lưng','case','Smartphone'],
 ['Chuột máy tính','mouse','Mouse'],['Bàn phím','keyboard','Keyboard'],['Loa âm thanh','speaker','Speaker'],['Giá đỡ','stand','Laptop'],['USB & lưu trữ','storage','HardDrive']
];
const brands=['Anker','Baseus','Logitech','UGREEN','JBL','Xiaomi'];
const sets=[
 ['Tai nghe Bluetooth chống ồn SoundPro X9','Tai nghe gaming RGB UltraSound G7','Tai nghe chụp tai không dây Studio Max','Tai nghe Bluetooth thể thao AirFit 2','Tai nghe in-ear Type-C Hi-Fi'],
 ['Củ sạc nhanh GaN 65W 3 cổng','Bộ sạc không dây MagSafe 15W','Adapter sạc nhanh PD 30W Mini','Trạm sạc để bàn 100W 4 cổng','Củ sạc USB-C 20W nhỏ gọn'],
 ['Cáp USB-C to USB-C 100W bọc dù','Cáp Lightning MFi 1.2m bền bỉ','Cáp HDMI 2.1 8K 2 mét','Cáp USB-C to HDMI 4K Ultra','Cáp sạc 3 trong 1 đa năng'],
 ['Pin sạc dự phòng 20.000mAh PD 30W','Pin dự phòng MagSafe 10.000mAh','Sạc dự phòng 10.000mAh mỏng nhẹ','Pin dự phòng 30.000mAh 65W','Sạc dự phòng tích hợp dây Type-C'],
 ['Ốp lưng iPhone 16 Pro MagSafe chống sốc','Ốp lưng iPhone 15 trong suốt chống ố','Ốp lưng Samsung S25 silicon nhám','Ốp lưng chống rơi viền titan','Ốp lưng bảo vệ camera Full Shield'],
 ['Chuột gaming không dây Hero X','Chuột văn phòng Silent Click M220','Chuột công thái học Ergo Pro','Chuột gaming RGB 12.000 DPI','Chuột Bluetooth siêu mỏng Travel'],
 ['Bàn phím cơ 75% Gasket RGB','Bàn phím không dây Low Profile K8','Bàn phím cơ switch đỏ Hot-Swap','Bàn phím văn phòng không dây Combo','Bàn phím gaming 60% Mini Pro'],
 ['Loa Bluetooth chống nước Boom Mini','Loa máy tính 2.0 Stereo Desk','Loa Bluetooth 360 độ SoundBox','Loa mini di động Bass Go','Loa Bluetooth RGB Gaming Bar'],
 ['Giá đỡ laptop nhôm gấp gọn','Giá đỡ điện thoại để bàn xoay 360','Kệ nâng màn hình công thái học','Giá đỡ laptop tản nhiệt 6 quạt','Giá treo tai nghe gaming hợp kim'],
 ['USB 3.2 128GB tốc độ cao','Thẻ nhớ microSD 256GB A2','Ổ cứng SSD di động 1TB USB-C','Đầu đọc thẻ nhớ 2 trong 1','USB kim loại 64GB chống nước']
];
const prices=[590000,299000,129000,690000,159000,349000,990000,249000,399000,189000];
async function main(){
 if(!process.env.MONGO_URI)throw new Error('Chưa thiết lập MONGO_URI');
 await mongoose.connect(process.env.MONGO_URI);
 // Safe, repeatable seeding: upsert demo records by unique fields, without deleting user data.
 const cs=[];for(const [name,short,icon] of categories)cs.push(await Category.findOneAndUpdate({slug:slug(name)},{$set:{name,icon}},{upsert:true,new:true}));
 const bs=[];for(const name of brands)bs.push(await Brand.findOneAndUpdate({slug:slug(name)},{$set:{name}},{upsert:true,new:true}));
 const adminPass=process.env.SEED_ADMIN_PASSWORD||'TechAdmin@2026';const userPass=process.env.SEED_USER_PASSWORD||'TechUser@2026';
 const users=[];for(const [name,email,role,pass] of [['TECH Administrator','admin@tech.local','admin',adminPass],['Nguyễn Minh Anh','minhanh@tech.local','user',userPass],['Trần Gia Huy','giahuy@tech.local','user',userPass],['Lê Ngọc Hà','ngocha@tech.local','user',userPass]]){
  const original=await User.findOne({email});
  users.push(original||await User.create({name,email,role,passwordHash:await bcrypt.hash(pass,12)}));
 }
 const ps=[];
 for(let c=0;c<sets.length;c++)for(let i=0;i<sets[c].length;i++){
  const name=sets[c][i],s=slug(name),price=prices[c]+i*(c%2?28000:45000),old=Math.round(price*(i===1?1.82:1.13+(i%3)*.05)/1000)*1000;
  const item=await Product.findOneAndUpdate({slug:s},{$setOnInsert:{name,slug:s,category:cs[c].id,brand:bs[(c+i)%bs.length].id,price,originalPrice:old,stock:8+((i*7+c*3)%45),sold:70+(c*31+i*27)%730,description:`${name} - phụ kiện công nghệ chính hãng, thiết kế hiện đại, đáp ứng nhu cầu học tập, làm việc và giải trí. Hỗ trợ tư vấn và bảo hành tại TECH.`,shortDescription:`${name} chất lượng cao, bảo hành rõ ràng và giao hàng nhanh.`,images:[`/products/${categories[c][1]}-${i%2+1}.svg`],featured:i<2,badge:i===0?'hot':i===1?'sale':i===2?'new':'',tags:[categories[c][0],'chính hãng','phụ kiện công nghệ'],specs:{'Thương hiệu':bs[(c+i)%bs.length].name,'Bảo hành':'12 tháng','Màu sắc':i%2?'Đen':'Xám titan'}}},{upsert:true,new:true});ps.push(item);
 }
 await Banner.findOneAndUpdate({title:'Công nghệ trong từng kết nối'},{$set:{title:'Công nghệ trong từng kết nối',subtitle:'Bộ sưu tập phụ kiện công nghệ ưu đãi lên đến 45%',href:'/san-pham?sort=popular',sort:0,active:true}},{upsert:true});
 await Banner.findOneAndUpdate({title:'Nâng cấp góc làm việc'},{$set:{title:'Nâng cấp góc làm việc',subtitle:'Chuột, bàn phím, giá đỡ giá tốt mỗi ngày',href:'/san-pham?category=ban-phim',sort:1,active:true}},{upsert:true});
 const today=new Date();const expiry=new Date(Date.now()+1000*60*60*24*180);
 for(const [code,type,value,minSpend,maxDiscount] of [['TECH10','percent',10,200000,100000],['WELCOME50','fixed',50000,300000,0],['FREESHIP','fixed',25000,150000,0]]){
  await Coupon.findOneAndUpdate({code},{$setOnInsert:{code,type,value,minSpend,maxDiscount,limit:100,used:0,startAt:today,expiresAt:expiry,active:true}},{upsert:true});
 }
 const sampleAddress={name:'Nguyễn Minh Anh',phone:'0901234567',line:'123 Nguyễn Văn Linh',ward:'Tân Phong',district:'Quận 7',city:'TP. Hồ Chí Minh'};
 await Address.findOneAndUpdate({user:users[1].id,line:sampleAddress.line},{$setOnInsert:{...sampleAddress,user:users[1].id,isDefault:true}},{upsert:true});
 for(let i=0;i<5;i++){
  const p=ps[i*2],u=users[i%3+1],status=['delivered','delivered','pending','confirmed','shipping'][i];
  const key=`seed-order-${i+1}`;
  await Order.findOneAndUpdate({user:u.id,idempotencyKey:key},{$setOnInsert:{user:u.id,idempotencyKey:key,items:[{product:p.id,name:p.name,slug:p.slug,image:p.images[0],price:p.price,quantity:1}],shippingAddress:sampleAddress,shippingMethod:'standard',paymentMethod:'COD',paymentStatus:status==='delivered'?'paid':'unpaid',status,subtotal:p.price,shippingFee:p.price>=500000?0:25000,discount:0,total:p.price+(p.price>=500000?0:25000),...(status==='delivered'?{deliveredAt:new Date()}:{})}},{upsert:true});
  if(status==='delivered')await Review.findOneAndUpdate({user:u.id,product:p.id},{$setOnInsert:{user:u.id,product:p.id,rating:5,comment:'Sản phẩm dùng rất ổn, đóng gói cẩn thận và giao hàng nhanh.'}},{upsert:true});
 }
 for(const p of ps.slice(0,10)){
  const rs=await Review.aggregate([{$match:{product:p._id}},{$group:{_id:null,rating:{$avg:'$rating'},count:{$sum:1}}}]);
  if(rs[0])await Product.updateOne({_id:p.id},{$set:{rating:Math.round(rs[0].rating*10)/10,reviewCount:rs[0].count}});
 }
 console.log(`✅ Seed: ${ps.length} sản phẩm, ${cs.length} danh mục, ${bs.length} thương hiệu, ${users.length} tài khoản, 5 đơn hàng.\nAdmin admin@tech.local / ${adminPass}\nUser minhanh@tech.local / ${userPass}`);
 await mongoose.disconnect();
}
main().catch(e=>{console.error('SEED ERROR',e);process.exit(1)});
