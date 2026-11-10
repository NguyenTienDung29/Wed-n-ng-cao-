import React from 'react';import {Helmet} from 'react-helmet-async';
export default function SEO({title='TECH - Phụ kiện công nghệ chính hãng, giá tốt',description='Mua phụ kiện công nghệ chính hãng tại TECH: tai nghe, sạc nhanh, chuột gaming, bàn phím, loa Bluetooth. Giá tốt và giao hàng toàn quốc.',image='/products/headphones-1.svg',path='',structured}){
 const base=typeof window!=='undefined'?window.location.origin:'http://localhost:5173';const canonical=base+path;
 return <Helmet><title>{title}</title><meta name="description" content={description}/><meta property="og:title" content={title}/><meta property="og:description" content={description}/><meta property="og:type" content="website"/><meta property="og:image" content={image.startsWith('http')?image:base+image}/><meta property="og:url" content={canonical}/><link rel="canonical" href={canonical}/>{structured&&<script type="application/ld+json">{JSON.stringify(structured).replace(/</g,'\\u003c')}</script>}</Helmet>
}
