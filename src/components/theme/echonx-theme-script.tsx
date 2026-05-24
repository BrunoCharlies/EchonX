import { ECHONX_THEME_STORAGE_KEY } from "@/lib/theme/echonx-theme";

/** Runs before paint to avoid flash of wrong theme. */
export function EchonxThemeScript() {
  const key = ECHONX_THEME_STORAGE_KEY;
  const script = `(function(){
try{
var p=location.pathname;
var marketing=p==="/"||p==="/about"||p==="/pricing"||p==="/explore"||p==="/faq"||p==="/terms"||p==="/privacy"||p.indexOf("/u/")===0;
var audiopost=p==="/app";
var isAdmin=document.documentElement.getAttribute("data-is-admin")==="1";
var uid=document.documentElement.getAttribute("data-user-id")||"";
var dark=function(){document.documentElement.classList.add("dark");document.documentElement.style.colorScheme="dark";};
var lumos=function(){document.documentElement.classList.remove("dark");document.documentElement.style.colorScheme="light";};
if(audiopost||marketing&&!isAdmin){dark();return;}
var theme="dark";
var ck=document.cookie.match(/${key}=([^;]+)/);
if(ck&&ck[1]==="lumos"){
  var cuid=(document.cookie.match(/echonx-theme-uid=([^;]+)/)||[])[1];
  if(!uid||!cuid||cuid===uid)theme="lumos";
}
if(theme!=="lumos"){
  var sk=uid?"${key}:"+uid:"${key}";
  var ls=localStorage.getItem(sk);
  if(ls==="lumos")theme="lumos";
  else if(!uid){var leg=localStorage.getItem("${key}");if(leg==="lumos")theme="lumos";}
}
if(theme==="lumos")lumos();else dark();
}catch(e){document.documentElement.classList.add("dark");}
})();`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
