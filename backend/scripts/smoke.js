// Run against a seeded, running local API: npm run smoke
// Creates then cancels a small COD order. Do not use on production databases.
require('dotenv').config();
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const root=process.env.SMOKE_API_URL||`http://localhost:${process.env.PORT||5000}/api`;
async function request(path,method='GET',body,token){
 const res=await fetch(root+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{})});
 const data=await res.json();return {status:res.status,data};
}
async function main(){
 console.log('TECH smoke testing',root);
 let r=await request('/health');assert.equal(r.status,200);assert.equal(r.data.ok,true);
 r=await request('/catalog/categories');assert.equal(r.status,200);assert.ok(r.data.length>=8);
 r=await request('/catalog/products?limit=10');assert.equal(r.status,200);assert.ok(r.data.items.length>=1);
 const p=r.data.items.find(p=>p.stock>2);assert.ok(p,'Cần ít nhất một sản phẩm còn hàng');
 const pw=process.env.SEED_USER_PASSWORD||'TechUser@2026';
 const login=await request('/auth/login','POST',{email:'minhanh@tech.local',password:pw});assert.equal(login.status,200);
 const token=login.data.token;
 const denied=await request('/admin/dashboard','GET',null,token);assert.equal(denied.status,403,'User không được truy cập Admin');
 const add=await request('/cart/items','POST',{productId:p._id,quantity:1},token);assert.equal(add.status,200);
 const quoted=await request('/orders/quote','POST',{shippingMethod:'standard'},token);assert.equal(quoted.status,200);assert.ok(quoted.data.total>=quoted.data.subtotal);
 const key='smoke-'+crypto.randomBytes(16).toString('hex');
 const ordered=await request('/orders','POST',{idempotencyKey:key,paymentMethod:'COD',shippingMethod:'standard',shippingAddress:{name:'Nguyễn Minh Anh',phone:'0901234567',line:'123 Đường Test',city:'TP. Hồ Chí Minh'}},token);
 assert.equal(ordered.status,201,`Checkout failed: ${JSON.stringify(ordered.data)}`);
 assert.equal(ordered.data.paymentStatus,'unpaid','COD không được đánh dấu thanh toán trước');
 const repeat=await request('/orders','POST',{idempotencyKey:key,paymentMethod:'COD',shippingAddress:{name:'Nguyễn Minh Anh',phone:'0901234567',line:'123 Đường Test',city:'TP. Hồ Chí Minh'}},token);
 assert.equal(repeat.status,200,'Idempotency must prevent duplicate orders');assert.equal(repeat.data._id,ordered.data._id);
 const mine=await request(`/orders/${ordered.data._id}`,'GET',null,token);assert.equal(mine.status,200);
 const cancel=await request(`/orders/${ordered.data._id}/cancel`,'PATCH',{},token);assert.equal(cancel.status,200);assert.equal(cancel.data.status,'cancelled');
 const cancelledTwice=await request(`/orders/${ordered.data._id}/cancel`,'PATCH',{},token);assert.equal(cancelledTwice.status,409);
 const other=await request('/auth/login','POST',{email:'giahuy@tech.local',password:pw});assert.equal(other.status,200);
 const forbidden=await request(`/orders/${ordered.data._id}`,'GET',null,other.data.token);assert.equal(forbidden.status,404,'User khác không được xem đơn');
 console.log('PASS: health, catalog, user JWT, Admin RBAC, cart, quote, COD, idempotency, status cancel, order ownership');
}
main().catch(err=>{console.error('FAIL:',err.message);process.exit(1)});
