var Bearer_token = 'QmVhcmVyIHB1YmxpY196dVVnRXpSMnQ3YWZGTGJ6NXprcEp3Wk53NW5mc3k5UQ=='
var ALERT_TITLE = "Cart Info";
var ALERT_BUTTON_TEXT = "Ok";
var listProducts = '';
var productslist = '';
var productL = [];
var redirect_flag = false;

function loadjQuery(){
  var jq = document.createElement('script'); jq.type = 'text/javascript';
  jq.src = 'https://ajax.aspnetcdn.com/ajax/jQuery/jquery-1.8.2.js';
  document.getElementsByTagName('head')[0].appendChild(jq);
}

if (typeof jQuery == 'undefined') {
  loadjQuery();
} else {}

getProductDetails();

Ecwid.OnCartChanged.add(function(cart){
   let subscription_ids = [];
   var cartArr = Object.keys(cart.items).map(function (key) { return cart.items[key].product.id; });
   var qty = Object.keys(cart.items).map(function (key) { return cart.items[key].quantity; });
     console.log('cartArr',cart.items);
   jQuery.each(productslist.items, function( index, value ) {
       if(typeof value.subscriptionSettings !== 'undefined' && value.enabled===true && value.subscriptionSettings.subscriptionAllowed===true){
       subscription_ids.push(value.id);
       }
   });
   var j=0; productL = [];
   jQuery.each(cartArr, function( index, value ) {


       if(jQuery.inArray(value, subscription_ids) !== -1)
         {


               if(qty[index]>1)
               {
               alert('Only one subscription allowed per cart; please email us for bulk options. Thank you.');
               Ecwid.Cart.removeProduct(index);
               var product = {
               id: value,
               quantity: 1,
               }
               Ecwid.Cart.addProduct(product);
               redirect_flag = true;
               /// storepage_redirect();
               }
               productL.push(value);
             //  console.log('productL',productL,productL.length);
               if(qty[index]==1 && productL.length>1)
               {
                     alert('Only one subscription allowed per cart; please email us for bulk options. Thank you.');
                     Ecwid.Cart.removeProduct(cartArr.length-1);
                     redirect_flag = true;
                     storepage_redirect();

               }
         j++;}
   });

});


function storepage_redirect(){
      Ecwid.OnPageLoaded.add(function(page) {
               /// console.log('productL123',productL,productL.length);
                if(page.type=='CART' && redirect_flag==true)
                {
                productL = [];redirect_flag = false;
                Ecwid.openPage('category');
                }
               });
}


async function getProductDetails()
{
  const options = {
    method: 'GET',
    headers: {Accept: 'application/json', Authorization: atob(Bearer_token)}
  };

  let productsresponse =await fetch('https://app.ecwid.com/api/v3/71163353/products', options)
    .then(response => response.json())
    .catch(err => console.error(err));
    productslist = productsresponse;
}




if(document.getElementById) {
    window.alert = function(txt) {
        createCustomAlert(txt);
    }
}

function createCustomAlert(txt) {
    d = document;

    if(d.getElementById("modalContainer")) return;

    mObj = d.getElementsByTagName("body")[0].appendChild(d.createElement("div"));
    mObj.id = "modalContainer";
    mObj.style.height = d.documentElement.scrollHeight + "px";

    alertObj = mObj.appendChild(d.createElement("div"));
    alertObj.id = "alertBox";
    if(d.all && !window.opera) alertObj.style.top = document.documentElement.scrollTop + "px";
    alertObj.style.left = (d.documentElement.scrollWidth - alertObj.offsetWidth)/2 + "px";
    alertObj.style.visiblity="visible";

    h1 = alertObj.appendChild(d.createElement("h1"));
    h1.appendChild(d.createTextNode(ALERT_TITLE));

    msg = alertObj.appendChild(d.createElement("p"));
    //msg.appendChild(d.createTextNode(txt));
    msg.innerHTML = txt;

    btn = alertObj.appendChild(d.createElement("a"));
    btn.id = "closeBtn";
    btn.appendChild(d.createTextNode(ALERT_BUTTON_TEXT));
    btn.href = "#";
    btn.focus();
    btn.onclick = function() { removeCustomAlert();return false; }

    alertObj.style.display = "block";

}

function removeCustomAlert() {
    document.getElementsByTagName("body")[0].removeChild(document.getElementById("modalContainer"));
}
