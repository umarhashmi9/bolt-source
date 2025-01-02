import{E as p,c as v,i as h,d as C,a as y,m as b,s as g,b as E,e as F,f as $,g as S,h as k,r as o,u as P,R as H,j as O,k as B,l as j,n as D}from"./components-LSgrH8J_.js";/**
 * @remix-run/react v2.15.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */function z(d){if(!d)return null;let w=Object.entries(d),s={};for(let[a,e]of w)if(e&&e.__type==="RouteErrorResponse")s[a]=new p(e.status,e.statusText,e.data,e.internal===!0);else if(e&&e.__type==="Error"){if(e.__subType){let i=window[e.__subType];if(typeof i=="function")try{let r=new i(e.message);r.stack=e.stack,s[a]=r}catch{}}if(s[a]==null){let i=new Error(e.message);i.stack=e.stack,s[a]=i}}else s[a]=e;return s}/**
 * @remix-run/react v2.15.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */let n,t,f=!1;let c,I=new Promise(d=>{c=d}).catch(()=>{});function A(d){if(!t){if(window.__remixContext.future.v3_singleFetch){if(!n){let u=window.__remixContext.stream;h(u,"No stream found for single fetch decoding"),window.__remixContext.stream=void 0,n=C(u,window).then(l=>{window.__remixContext.state=l.value,n.value=!0}).catch(l=>{n.error=l})}if(n.error)throw n.error;if(!n.value)throw n}let i=y(window.__remixManifest.routes,window.__remixRouteModules,window.__remixContext.state,window.__remixContext.future,window.__remixContext.isSpaMode),r;if(!window.__remixContext.isSpaMode){r={...window.__remixContext.state,loaderData:{...window.__remixContext.state.loaderData}};let u=b(i,window.location,window.__remixContext.basename);if(u)for(let l of u){let _=l.route.id,x=window.__remixRouteModules[_],m=window.__remixManifest.routes[_];x&&g(m,x,window.__remixContext.isSpaMode)&&(x.HydrateFallback||!m.hasLoader)?r.loaderData[_]=void 0:m&&!m.hasLoader&&(r.loaderData[_]=null)}r&&r.errors&&(r.errors=z(r.errors))}t=E({routes:i,history:F(),basename:window.__remixContext.basename,future:{v7_normalizeFormMethod:!0,v7_fetcherPersist:window.__remixContext.future.v3_fetcherPersist,v7_partialHydration:!0,v7_prependBasename:!0,v7_relativeSplatPath:window.__remixContext.future.v3_relativeSplatPath,v7_skipActionErrorRevalidation:window.__remixContext.future.v3_singleFetch===!0},hydrationData:r,mapRouteProperties:$,dataStrategy:window.__remixContext.future.v3_singleFetch?S(window.__remixManifest,window.__remixRouteModules,()=>t):void 0,patchRoutesOnNavigation:k(window.__remixManifest,window.__remixRouteModules,window.__remixContext.future,window.__remixContext.isSpaMode,window.__remixContext.basename)}),t.state.initialized&&(f=!0,t.initialize()),t.createRoutesForHMR=v,window.__remixRouter=t,c&&c(t)}let[w,s]=o.useState(void 0),[a,e]=o.useState(t.state.location);return o.useLayoutEffect(()=>{f||(f=!0,t.initialize())},[]),o.useLayoutEffect(()=>t.subscribe(i=>{i.location!==a&&e(i.location)}),[a]),P(t,window.__remixManifest,window.__remixRouteModules,window.__remixContext.future,window.__remixContext.isSpaMode),o.createElement(o.Fragment,null,o.createElement(H.Provider,{value:{manifest:window.__remixManifest,routeModules:window.__remixRouteModules,future:window.__remixContext.future,criticalCss:w,isSpaMode:window.__remixContext.isSpaMode}},o.createElement(O,{location:a},o.createElement(B,{router:t,fallbackElement:null,future:{v7_startTransition:!0}}))),window.__remixContext.future.v3_singleFetch?o.createElement(o.Fragment,null):null)}var M,R=j;R.createRoot,M=R.hydrateRoot;o.startTransition(()=>{M(document.getElementById("root"),D.jsx(A,{}))});
