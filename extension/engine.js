globalThis.Cardnal = (() => {
const cards = [
{id:"quicksilver",name:"Capital One Quicksilver",type:"cash",base:1.5,source:"https://www.capitalone.com/credit-cards/quicksilver/"},
{id:"savor",name:"Capital One Savor",type:"cash",base:1,rates:{dining:3,grocery:3},source:"https://www.capitalone.com/credit-cards/savor/"},
{id:"prime",name:"Prime Visa (eligible Prime membership)",type:"cash",base:1,rates:{amazon:5},source:"https://creditcards.chase.com/cash-back-credit-cards/amazon-prime-rewards"},
{id:"sapphire",name:"Chase Sapphire Preferred",type:"points",base:1,rates:{dining:3},source:"https://creditcards.chase.com/rewards-credit-cards/sapphire/preferred"}
];
function merchant(host){return ["amazon","target","walmart"].find(x=>host===x+".com"||host.endsWith("."+x+".com"))||null;}
function rank(ids,category,preference="none"){return cards.filter(c=>ids.includes(c.id)).map(c=>({...c,rate:c.rates?.[category]??c.base})).filter(c=>preference==="none"||c.type===preference).sort((a,b)=>b.rate-a.rate);}
function recommend(ids,category,preference="none"){const rows=rank(ids,category,preference); if(!rows.length)return {rows,message:"No matching cards. Add a card or change your preference."}; if(new Set(rows.map(c=>c.type)).size>1)return {rows,message:"Cash back and points are not directly comparable. Choose a rewards preference."}; const winners=rows.filter(c=>c.rate===rows[0].rate);return {rows,message:winners.length>1?"Tie: "+winners.map(c=>c.name).join(" / "):"Estimated best: "+winners[0].name};}
return {cards,merchant,rank,recommend};
})();