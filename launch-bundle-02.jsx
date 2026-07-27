import { useState } from "react";

const T = { paper:"#F7F5F0", ink:"#1C2530", navy:"#1F3A5F", green:"#1E8A66", amber:"#C4922E", line:"#D8D3C8", dim:"#6B7280" };
const STEPS = [
  { key:"product", label:"Create product" },
  { key:"price", label:"Attach $149 one-time price" },
  { key:"link", label:"Generate payment link + delivery message" },
];
const DELIVERY = "Thank you for your purchase! Download the Employee Handbook & HR Policy Pack here: https://matchedmd.ai/Employee-Handbook-HR-Policy-Pack.zip \u2014 Inside are seven Word templates plus a START-HERE guide. Have your attorney or HR professional review before use. Questions? Reply to your Stripe receipt email.";

export default function LaunchBundle2() {
  const [running,setRunning]=useState(false);
  const [done,setDone]=useState({});
  const [result,setResult]=useState(null);
  const [log,setLog]=useState([]);
  const [error,setError]=useState(null);
  const [copied,setCopied]=useState(false);
  const say=(m)=>setLog(l=>[...l,m]);

  async function launch(){
    setRunning(true);setError(null);setResult(null);setDone({});setLog([]);
    say("Connecting to Stripe\u2026");
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-6",
          max_tokens:1000,
          messages:[{role:"user",content:
`Use your Stripe tools to do the following, in order:
1. Create a product named "Employee Handbook & HR Policy Pack" with description "Seven editable Word templates for hiring and managing staff in a small medical, dental, or therapy practice: Employee Handbook, Job Description Pack (Front Desk, Medical Assistant, Office Manager), New Hire Onboarding Checklist, Confidentiality & HIPAA Workforce Agreement, Performance Review Form, Corrective Action Form, and PTO Request Form. Instant digital download. Attorney/HR review recommended before use."
2. Create a one-time price for that product: 14900 cents, currency usd.
3. Create a payment link for that price, quantity 1.
4. Update that payment link so its after-completion behavior is a hosted confirmation with this exact custom message: "${DELIVERY}" \u2014 if your tools cannot update a payment link, skip this step and note it.
Then respond with ONLY a JSON object, no markdown fences, no other text:
{"product_id":"...","price_id":"...","payment_link_url":"...","delivery_message_set":true_or_false}`
          }],
          mcp_servers:[{type:"url",url:"https://mcp.stripe.com",name:"stripe-mcp"}],
        }),
      });
      const data=await res.json();
      if(data.error) throw new Error(data.error.message||"API error");
      const calls=(data.content||[]).filter(b=>b.type==="mcp_tool_use");
      calls.forEach(c=>say(`Stripe: ${c.name}`));
      if(calls.some(c=>/product/i.test(c.name)))setDone(d=>({...d,product:true}));
      if(calls.some(c=>/price/i.test(c.name)))setDone(d=>({...d,price:true}));
      if(calls.some(c=>/payment_link|link/i.test(c.name)))setDone(d=>({...d,link:true}));
      const text=(data.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("\n");
      let parsed=null;
      try{parsed=JSON.parse(text.replace(/```json|```/g,"").trim());}catch{}
      if(!parsed?.payment_link_url){
        for(const r of (data.content||[]).filter(b=>b.type==="mcp_tool_result")){
          const t=r?.content?.[0]?.text||"";
          const m=t.match(/https:\/\/buy\.stripe\.com\/\S+/);
          if(m){parsed={...(parsed||{}),payment_link_url:m[0].replace(/["',}]+$/,"")};break;}
        }
      }
      if(parsed?.payment_link_url){
        setDone({product:true,price:true,link:true});
        setResult(parsed);
        say(parsed.delivery_message_set===false?"Link live \u2014 delivery message could not be attached.":"Link live with delivery message.");
      } else {
        throw new Error("Steps ran but no payment link came back. Check the Stripe dashboard, then run again if needed.");
      }
    }catch(e){setError(e.message);}
    finally{setRunning(false);}
  }

  async function copy(){
    try{await navigator.clipboard.writeText(result.payment_link_url);setCopied(true);setTimeout(()=>setCopied(false),1600);}catch{}
  }

  return (
    <div style={{minHeight:"100vh",background:T.paper,color:T.ink,fontFamily:"Georgia, 'Times New Roman', serif",padding:"28px 20px 60px"}}>
      <div style={{maxWidth:560,margin:"0 auto"}}>
        <div style={{fontFamily:"ui-monospace, Menlo, monospace",fontSize:11,letterSpacing:"0.14em",color:T.dim,textTransform:"uppercase"}}>Launch console · product 02</div>
        <h1 style={{fontSize:30,lineHeight:1.15,margin:"10px 0 6px",color:T.navy,fontWeight:700}}>Employee Handbook &amp; HR Policy Pack</h1>
        <p style={{fontSize:15,color:T.dim,margin:"0 0 26px"}}>Seven templates · $149 one-time · delivery message included</p>

        <div style={{borderTop:`1px solid ${T.line}`}}>
          {STEPS.map(s=>{
            const ok=done[s.key];
            return (
              <div key={s.key} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 2px",borderBottom:`1px solid ${T.line}`}}>
                <div style={{width:22,height:22,borderRadius:"50%",flexShrink:0,border:`2px solid ${ok?T.green:T.line}`,background:ok?T.green:"transparent",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,transition:"all .3s"}}>{ok?"\u2713":""}</div>
                <div style={{fontSize:15}}>{s.label}</div>
                <div style={{marginLeft:"auto",fontFamily:"ui-monospace, Menlo, monospace",fontSize:11,color:ok?T.green:T.dim}}>{ok?"done":running?"\u2026":"ready"}</div>
              </div>
            );
          })}
        </div>

        <button onClick={launch} disabled={running}
          style={{width:"100%",marginTop:22,padding:"14px 0",fontSize:16,fontFamily:"inherit",fontWeight:700,letterSpacing:"0.02em",background:running?T.dim:T.navy,color:"#fff",border:"none",borderRadius:8,cursor:running?"default":"pointer"}}>
          {running?"Creating on Stripe\u2026":result?"Run again":"Create product on Stripe"}
        </button>

        {log.length>0&&(
          <div style={{marginTop:18,padding:"12px 14px",background:"#fff",border:`1px solid ${T.line}`,borderRadius:8,fontFamily:"ui-monospace, Menlo, monospace",fontSize:12,color:T.dim}}>
            {log.map((m,i)=><div key={i} style={{padding:"2px 0"}}>&rsaquo; {m}</div>)}
          </div>
        )}

        {error&&(
          <div style={{marginTop:14,padding:"12px 14px",borderRadius:8,border:`1px solid ${T.amber}`,background:"#FCF6E8",fontSize:14}}>
            <strong>Didn't complete.</strong> {error}
          </div>
        )}

        {result&&(
          <div style={{marginTop:18,padding:"18px 16px",borderRadius:8,border:`2px solid ${T.green}`,background:"#fff"}}>
            <div style={{fontFamily:"ui-monospace, Menlo, monospace",fontSize:11,letterSpacing:"0.12em",color:T.green,textTransform:"uppercase",marginBottom:8}}>Live payment link</div>
            <div style={{fontSize:14,wordBreak:"break-all",marginBottom:12}}>
              <a href={result.payment_link_url} target="_blank" rel="noreferrer" style={{color:T.navy}}>{result.payment_link_url}</a>
            </div>
            <button onClick={copy} style={{padding:"8px 16px",fontSize:13,fontFamily:"inherit",background:T.green,color:"#fff",border:"none",borderRadius:6,cursor:"pointer"}}>{copied?"Copied":"Copy link"}</button>
            {result.delivery_message_set===false&&(
              <div style={{marginTop:10,fontSize:13,color:T.amber}}>Delivery message wasn't attached \u2014 paste the link to Claude and it will handle it.</div>
            )}
            {result.product_id&&(
              <div style={{marginTop:12,fontFamily:"ui-monospace, Menlo, monospace",fontSize:11,color:T.dim}}>{result.product_id} \u00b7 {result.price_id}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
