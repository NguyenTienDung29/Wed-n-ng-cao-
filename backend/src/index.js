require('dotenv').config();
const express=require('express'),mongoose=require('mongoose'),path=require('node:path'),fs=require('node:fs');
const helmet=require('helmet'),cors=require('cors'),compression=require('compression');
const {Product}=require('./models');
const {handler,notFound}=require('./middleware/error');
const {asyncRoute}=require('./utils/core');
if(!process.env.MONGO_URI||!process.env.JWT_SECRET||process.env.JWT_SECRET.length<32){console.error('Hãy tạo backend/.env từ .env.example, khai báo MONGO_URI và JWT_SECRET >=32 ký tự');process.exit(1)}
const app=express();app.disable('x-powered-by');
app.use(helmet({crossOriginResourcePolicy:{policy:'cross-origin'},contentSecurityPolicy:false}));
app.use(compression());
app.use(cors({origin:(origin,cb)=>!origin||origin===(process.env.FRONTEND_URL||'http://localhost:5173')?cb(null,true):cb(new Error('CORS không cho phép origin này'))}));
app.use(express.json({limit:'1mb'}));app.use(express.urlencoded({extended:false,limit:'1mb'}));
app.use('/uploads',express.static(path.resolve(__dirname,'../uploads'),{maxAge:'7d'}));
app.get('/api/health',(req,res)=>res.json({ok:true,service:'TECH API',timestamp:new Date().toISOString()}));
app.use('/api/auth',require('./routes/auth'));
app.use('/api/catalog',require('./routes/catalog'));
app.use('/api/cart',require('./routes/cart'));
app.use('/api/orders',require('./routes/orders'));
app.use('/api/admin',require('./routes/admin'));
app.use('/api',notFound);
const domain=()=>String(process.env.FRONTEND_URL||'http://localhost:5173').replace(/\/$/,'');
app.get('/robots.txt',(req,res)=>res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /tai-khoan\nDisallow: /gio-hang\nDisallow: /thanh-toan\nDisallow: /don-hang\nSitemap: ${domain()}/sitemap.xml\n`));
app.get('/sitemap.xml',asyncRoute(async(req,res)=>{
 const products=await Product.find({active:true}).select('slug updatedAt').lean();
 const staticPaths=['/','/san-pham'];
 const escape=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');
 const urls=[...staticPaths.map(p=>({loc:domain()+p})),...products.map(p=>({loc:domain()+'/san-pham/'+encodeURIComponent(p.slug),lastmod:p.updatedAt?.toISOString().slice(0,10)}))];
 res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(u=>`<url><loc>${escape(u.loc)}</loc>${u.lastmod?`<lastmod>${u.lastmod}</lastmod>`:''}</url>`).join('')}</urlset>`);
}));
// Production mode: serve built Vite app from the same backend. Inject crawler-visible
// product metadata and JSON-LD into the initial HTML (SPA hydration follows).
const dist=path.resolve(__dirname,'../../frontend/dist');
if(fs.existsSync(path.join(dist,'index.html'))){
 const escape=s=>String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
 app.get('/san-pham/:slug',asyncRoute(async(req,res,next)=>{
  const p=await Product.findOne({slug:req.params.slug,active:true}).populate('brand','name');if(!p)return next();
  let html=fs.readFileSync(path.join(dist,'index.html'),'utf8');const title=`${p.name} | TECH`;const description=(p.shortDescription||p.description||p.name).slice(0,155);
  const url=`${domain()}/san-pham/${encodeURIComponent(p.slug)}`;const picture=p.images[0]||'';const image=picture.startsWith('http')?picture:`${domain()}${picture}`;
  const jsonLd={ '@context':'https://schema.org','@type':'Product',name:p.name,description:p.description,image:p.images.map(i=>i.startsWith('http')?i:`${domain()}${i}`),sku:String(p._id),brand:{'@type':'Brand',name:p.brand?.name||'TECH'},offers:{'@type':'Offer',priceCurrency:'VND',price:p.price,availability:p.stock>0?'https://schema.org/InStock':'https://schema.org/OutOfStock',url},aggregateRating:p.reviewCount?{'@type':'AggregateRating',ratingValue:p.rating,reviewCount:p.reviewCount}:undefined};
  const head=`<title>${escape(title)}</title><meta name="description" content="${escape(description)}"><link rel="canonical" href="${escape(url)}"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:image" content="${escape(image)}"><meta property="og:url" content="${escape(url)}"><script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g,'\\u003c')}</script>`;
  html=html.replace(/<title>[^<]*<\/title>/,'').replace(/<meta name="description"[^>]*>/,'').replace('</head>',`${head}</head>`);
  html=html.replace('<div id="root"></div>',`<div id="root"><main><h1>${escape(p.name)}</h1><p>${escape(description)}</p><p>Giá: ${p.price.toLocaleString('vi-VN')} VNĐ</p></main></div>`);
  res.type('html').send(html);
 }));
 app.use(express.static(dist,{maxAge:'1h'}));
 app.get('*',(req,res)=>res.sendFile(path.join(dist,'index.html')));
}else app.use(notFound);
app.use(handler);
mongoose.connect(process.env.MONGO_URI,{serverSelectionTimeoutMS:8000}).then(()=>app.listen(Number(process.env.PORT)||5000,()=>console.log(`TECH API ready: http://localhost:${process.env.PORT||5000}`))).catch(err=>{console.error('MongoDB không kết nối được:',err.message);process.exit(1)});
