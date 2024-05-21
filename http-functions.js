 import {ok} from 'wix-http-functions';
 import wixData from 'wix-data';
 import {fetch} from 'wix-fetch';
 import { triggeredEmails,contacts} from 'wix-crm-backend';
 
  
export async function post_ecwidorder(request) {
  let options = {
    "headers": {
      "Content-Type": "application/json"
    }
  };
  
  // get the request body
  return request.body.text()
    .then( (body) => {
       let response = JSON.parse(body);
         //console.log('response_01_FEB',response.eventType);
         if(response.eventType=='order.updated')
         {
         updateStatus(response.data.orderId);
         return ok(); 
         }
       const options = {
         method: 'GET',
         headers: {"Accept": 'application/json', 'Authorization': 'Bearer secret_giRY2sd1CbXFDmRqn8wVEYyAFi6h9Uqu'}
       };    
   fetch("https://app.ecwid.com/api/v3/71163353/orders/"+response.data.orderId, options)
  .then( (httpResponse) => {
    if (httpResponse.ok) {
       return httpResponse.json();
    } else {
      return Promise.reject("Fetch did not succeed");
    }
  } )
  .then(response => sentOrderMail(response))
  .catch(err => console.log(err));
  return ok(); 
 });
   
}

async function updateStatus(orderID){
    
let OrderDetails  = await getOrderdetail(orderID);

  for (let i = 0; i < OrderDetails.items.length; i++) {
   
   if(OrderDetails.items[i].subscriptionId!=null)
   {
        let subscripton_response = await getSubscription(OrderDetails.items[i].subscriptionId);
           let options = {
            "suppressAuth": true
            };
            wixData.query("orderData")
            .eq("subscriptionId", OrderDetails.items[i].subscriptionId)
            .find(options)
            .then( (results) => {
            if(results.items.length > 0) {
            let item = results.items[0];
            item.subscriptionStatus = subscripton_response.status;
            item.subscriptionInfo = subscripton_response;  
            wixData.update("orderData", item,options);
            } 
            } )
            .catch( (err) => {
            let errorMsg = err;
            //console.log('errorMsg',errorMsg);
            } );
   }
  }
return ok();
}


async function sentOrderMail(response)
{
  var consultingWasBought = false; var allorderflag = true; var shippingCost;
  //console.log('response_sentOrderMail',response);
  for (let i = 0; i < response.items.length; i++) {
    var productName = response.items[i].name.toLowerCase(); 
   if(response.items[i].subscriptionId!=null && response.items[i].sku!='App-11')
   {
        var subscripton_response_order = await getSubscription(response.items[i].subscriptionId);
        console.log('21_May_response_order',response.items[i]);
        sentSubscriptionOrderMail(i,response,subscripton_response_order)
        if(subscripton_response_order.orders.length>1)
        {
          allorderflag = false;
        }
   }
   else if(productName.includes('consult')) {
   
    consultingWasBought = true;
  } else if(response.items[i].sku=='App-11' || response.items[i].sku=='App-88' || response.items[i].sku=='App-99') {
     sentApp_OrderMails(i,response);
  }
  if(response.items[i].isShippingRequired==true){
  shippingCost = shippingCost+response.items[i].shipping;
  }
   AddtoAllStore(response,i); 
}
if(consultingWasBought)
  {
    sentConsultingOrderMail(response);
  }
  if(allorderflag){
   sentAllOrderEmail(response);
  }
}

async function sentAllOrderEmail(response){
 let result = await ContactCreateWix(response.billingPerson.name,response.email);
  let vendor =  await ContactCreateWix("Rob Maze","robmazemfg@gmail.com");
// let vendor =  await ContactCreateWix("Pawan kumar","pawankumar.team@gmail.com");

 let BillingAddress = response.billingPerson.name+", "+response.billingPerson.street+", "+response.billingPerson.city+", "+response.billingPerson.stateOrProvinceName+", "+response.billingPerson.countryName+", "+response.billingPerson.postalCode;
 var ShipingAddress = '';
 if(response.shippingPerson!=null){
  ShipingAddress = response.shippingPerson.name+", "+response.shippingPerson.street+", "+response.shippingPerson.city+", "+response.shippingPerson.stateOrProvinceName+", "+response.shippingPerson.countryName+", "+response.shippingPerson.postalCode;
 }
 //console.log('response',response);
 let item1=''; 
 let item1_q = '';
 let item1_p = '';
 let item1_d = '';
 let item2='';
 let item2_q = '';
 let item2_p = '';
 let item2_d = '';
 let item3 = '';
 let item3_q = '';
 let item3_p = '';
 let item3_d = '';
 let item4 = '';
 let item4_q = '';
 let item4_p = '';
 let item4_d = '';
 let item5 = '';
 let item5_q = '';
 let item5_p = '';
 let item5_d = '';
 let coupon = '';
 let shippingcost = 0;
 let couponCode = '';
 let giftmessage = '';
  
  if(response.items[0]!=null){
  item1 = response.items[0].name+': '+response.items[0].quantity+' $'+response.items[0].price;
  //item1_t = response.items[0].quantity+"      $"+response.items[0].price+"      "+response.items[0].name;
   item1_q = response.items[0].quantity;
   item1_p = "$"+response.items[0].price;
   item1_d = response.items[0].name;
  shippingcost = response.items[0].shipping;
  }
 if(response.items[1]!=null){
  item2 = response.items[1].name+': '+response.items[1].quantity+' $'+response.items[1].price;
  //item2_t = response.items[1].quantity+'      $'+response.items[1].price+'      '+response.items[1].name;
   item2_q = response.items[1].quantity;
   item2_p = "$"+response.items[1].price;
   item2_d = response.items[1].name;
  shippingcost += response.items[1].shipping;
  }
 if(response.items[2]!=null){
  item3 = response.items[2].name+': '+response.items[2].quantity+' $'+response.items[2].price;
  //item3_t = response.items[2].quantity+'      $'+response.items[2].price+'      '+response.items[2].name;
   item3_q = response.items[2].quantity;
   item3_p = "$"+response.items[2].price;
   item3_d = response.items[2].name;
  shippingcost += response.items[2].shipping;
  }
 if(response.items[3]!=null){
  item4 = response.items[3].name+': '+response.items[3].quantity+' $'+response.items[3].price;
  //item4_t = response.items[3].quantity+'      $'+response.items[3].price+'      '+response.items[3].name;
   item4_q = response.items[3].quantity;
   item4_p = "$"+response.items[3].price;
   item4_d = response.items[3].name;
  shippingcost += response.items[3].shipping;
  }
   if(response.items[4]!=null){
  item5 = response.items[4].name+': '+response.items[4].quantity+' $'+response.items[4].price;
  //item5_t = response.items[4].quantity+'   $'+response.items[4].price+'   '+response.items[4].name;
   item5_q = response.items[4].quantity;
   item5_p = "$"+response.items[4].price;
   item5_d = response.items[4].name;
  shippingcost += response.items[4].shipping;
  }
  //console.log('response.couponApplied',response.items[0].couponApplied,response.couponDiscount);
  if(response.items[0].couponApplied==true)
  {
  coupon = 'Discount: '+response.couponDiscount; 
  couponCode =  'coupon Used: '+response.discountCoupon.code;
  }
  if(response.extraFields.dcjydw5!=null)
  {
     giftmessage = response.extraFields.dcjydw5;
  }
  triggeredEmails.emailContact('T6NSu1d', result._id, {
   variables: {
    'name': response.billingPerson.name,
     'orderNumber': response.orderNumber,
     'item1': item1,
     'item2': item2,
     'item3': item3,
     'item4': item4,
     'item5' : item5,
     'orderNo': response.id,
     'orderNo.': response.id,
     'total': '$'+response.total,
     'shippingcost': '$'+shippingcost,
     'contact.Name.First': response.billingPerson.name,
      'tax': '$'+response.tax,
      'coupon':coupon,
     'ShippingAdress': ShipingAddress,
     'BillingAdress':BillingAddress,
     'couponCode':couponCode
   }
}).then( (results) => {
  console.log('sending all order mails',response.id);
 } )
.catch( (err) => {
            let errorMsg = err;
            console.log('errorMsg',errorMsg);
            } );
//console.log('sending items',item1_p,item1_q,item1_d);
    triggeredEmails.emailContact('TUQyOa1', vendor._id, {
   variables: {
    'name': response.shippingPerson.name,
     'orderNumber': response.orderNumber,
     'item1_p': item1_p,
     'item1_q': item1_q,
     'item1_d': item1_d,
     'item2_p': item2_p,
     'item2_q': item2_q,
     'item2_d': item2_d,
     'item3_p': item3_p,
     'item3_q': item3_q,
     'item3_d': item3_d,
     'item4_p': item4_p,
     'item4_q': item4_q,
     'item4_d': item4_d,
     'item5_p': item5_p,
     'item5_q': item5_q,
     'item5_d': item5_d,
     'orderNo': response.id,
     'orderNo.': response.id,
     'total': '$'+response.total,
     'shippingcost': '$'+shippingcost,
     'contact.Name.First': response.billingPerson.name,
      'tax': '$'+response.tax,
      'coupon':coupon,
     'ShippingAdress': ShipingAddress,
     'BillingAdress':BillingAddress,
     'couponCode':couponCode,
     'city':response.shippingPerson.city,
     'zip': response.shippingPerson.postalCode,
     'state': response.shippingPerson.stateOrProvinceName,
     'country' : response.shippingPerson.countryName,
     'streetaddress' : response.shippingPerson.street,
     'giftmessage' : giftmessage
   }
}).then( (results) => {
  console.log('sending all order mails for T6NSu1d',response.id);
 } )
.catch( (err) => {
            let errorMsg = err;
            console.log('errorMsg for  for T6NSu1d',errorMsg,giftmessage);
            } );
}

function AddtoAllStore(response,i){
   //console.log('response_add_to_allstore',response,i,response.shippingPerson,response.billingPerson);
  let options = {"suppressAuth": true};  let ShippingAddress = '';
  //billingAddress, shippingAddress, costPerItem, couponCode, couponDiscount, taxes, message1, message2
 let BillingAddress = response.billingPerson.name+", "+response.billingPerson.street+", "+response.billingPerson.city+", "+response.billingPerson.stateOrProvinceName+", "+response.billingPerson.countryName+", "+response.billingPerson.postalCode;
 if(response.shippingPerson!=null){
  ShippingAddress = response.shippingPerson.name+", "+response.shippingPerson.street+", "+response.shippingPerson.city+", "+response.shippingPerson.stateOrProvinceName+", "+response.shippingPerson.countryName+", "+response.shippingPerson.postalCode;
 }
  var couponCode = '';
 var couponDiscount = '';
 if(response.items[i].couponApplied == true)
{
  couponDiscount = response.items[i].couponAmount;
}
if(response.discountCoupon != undefined)
{
 couponCode = response.discountCoupon.code;
} 
//console.log('response2',response,BillingAddress,ShippingAddress);
let orderInfo = {
                    "productName": response.items[i].name,
                    "orderNumber":response.id,
                    "orderInfo":response,
                    "email": response.email,
                    "name": response.billingPerson.name,
                    "subscriptionId":response.items[i].name,
                    "billingAddress":BillingAddress,
                    "shippingAddress":ShippingAddress,
                    "costPerItem":response.items[i].price,
                    "taxes":response.items[i].tax,
                    "totalRecived":response.usdTotal,
                    "shippingCost":response.items[i].shipping,
                    "couponCode": couponCode,
                    "couponDiscount":couponDiscount,
                    "billingZipCode":response.billingPerson.postalCode,
                    "message1":response.orderComments
                 }
//console.log('orderInfo',orderInfo);
wixData.insert("All_Store_Orders", orderInfo,options).catch( (err) => {

           // console.log('orderInfosave',err);

            } );
}

 async function sentConsultingOrderMail(response)
  {

       let result = await ContactCreateWix(response.billingPerson.name,response.email);
       triggeredEmails.emailContact('SuzB70b', result._id, {
                variables: {
                    'orderNo': response.id,
                 }
        });

  }



async function sentSubscriptionOrderMail(i,response,subscripton_response)
{
     // console.log('productName_30_april_24_1',response);
      if(subscripton_response.orders.length>1){
       // console.log('updateRenewal',subscripton_response.subscriptionId);
          let options = {
            "suppressAuth": true
            };
            wixData.query("orderData")
            .eq("subscriptionId", subscripton_response.subscriptionId)
            .find(options)
            .then( (results) => {
            if(results.items.length > 0) {
            let item = results.items[0];
            item.subscriptionStatus = subscripton_response.status; 
            item.paymentsReceived = subscripton_response.orders.length;
            item.subscriptionInfo = subscripton_response; 
            item.paymentCycle = [{
                        'Purchased on': subscripton_response.created,
                        'next charge':subscripton_response.nextCharge
                    }],
            wixData.update("orderData", item,options).then(() => {
                                  
                                    })
                                    .catch((err) => {
                                    console.log("Error in updating renew ",err);
                                    });
           
            }
            //console.log('result',results.items.length,subscripton_response.subscriptionId); 
            } )
            .catch( (err) => {
            let errorMsg = err;
            console.log('errorMsg',errorMsg);
            } );
            return false;
      }
       
      let options = {"suppressAuth": true};
      let AlreadyOrderSts =   await wixData.query('orderData').eq('subscriptionId',subscripton_response.subscriptionId).find(options);
     
       if(AlreadyOrderSts.length>0)
      {
       // console.log('updateRenewal',subscripton_response.subscriptionId);
  let options = {
            "suppressAuth": true
            };
            wixData.query("orderData")
            .eq("subscriptionId", subscripton_response.subscriptionId)
            .find(options)
            .then( (results) => {
            if(results.items.length > 0) {
            let item = results.items[0];
            item.subscriptionStatus = subscripton_response.status; 
            item.paymentsReceived = subscripton_response.orders.length;
            item.subscriptionInfo = subscripton_response; 
            item.paymentCycle = [{
                        'Purchased on': subscripton_response.created,
                        'next charge':subscripton_response.nextCharge
                    }],
            wixData.update("orderData", item,options).then(() => {
                                    //console.log("renew Updated Sucessfully") //see item below
                                    })
                                    .catch((err) => {
                                    console.log("Error in updating renew ",err);
                                    });
            //console.log('updateRenewal post',subscripton_response.subscriptionId);
            } 
            } )
            .catch( (err) => {
            let errorMsg = err;
            console.log('errorMsg',errorMsg);
            } );
            return false;
      }
         //console.log('sending mail',response.id);
         const name1 = 'bronze',
         name2 = 'gold',
         name3 = 'silver';
         const  name4 = 'platinum';
         let productName = response.items[i].name.toLowerCase(); 
         let plan = '';
         //console.log('productName',productName);
         let cartContainsSpecificProduct = productName.includes(name1) || productName.includes(name2) || productName.includes(name3) || productName.includes(name4);
       
         if (cartContainsSpecificProduct==true) {
             if (productName.includes(name1)) {
                 plan = name1;
             }
              if (productName.includes(name2)) {
                plan = name2;
            }
            if (productName.includes(name3)) {
                plan = name3;
            }
            if (productName.includes(name4)) {
                plan = name4;
             }
         }
      
      let preferences = [{
        name: 'bronze',
        collectionId: 'Diamond',
        prefix: '3AF3-22-7@XA-',
        field: 'RESULTS'
    },
    {
        name: 'gold',
        collectionId: 'Diamond-2',
        prefix: '81AC-44-7@XA-',
        field: 'results'
    },
    {
        name: 'silver',
        collectionId: 'Diamond-1',
        prefix: '1EAA-33-7@XA-',
        field: 'results'
    },
    {
        name: 'platinum',
        collectionId: 'Diamond-3',
        prefix: '2FAd-55-7@XA-',
        field: 'title'
    }
];
      let boughtPlan = preferences.find(any => any.name === plan);
     
      let RESULTS;var finalHEX; let userId;let owner;
        
      wixData.query(boughtPlan.collectionId).ne('isAssigned', true)
                     .find()
                     .then((res) => {
                          if(res.length>0){
                          RESULTS = res.items[0];
                          finalHEX = RESULTS[boughtPlan.field];
                          owner = RESULTS._owner;
                          } else {
                          finalHEX = 'email robmazemfg@gmail.com for hex code';
                          SendWithoutHexMail(response.email,response.billingPerson.name,boughtPlan.prefix+''+finalHEX,response.id,response.items[i].name);
                          finalHEX = '';
                          saveOrder(i,response,response.email,response.billingPerson.name,boughtPlan.prefix,finalHEX,boughtPlan.name)
                          return ok();
                          }
                          SendHexMail(response.email,response.billingPerson.name,boughtPlan.prefix+''+finalHEX,response.id,response.items[i].name);
                          saveOrder(i,response,response.email,response.billingPerson.name,boughtPlan.prefix,finalHEX,boughtPlan.name)
 
                               var broughtplan_field = boughtPlan.field;
                               let updateData = {
                                        "_id": RESULTS._id,
                                        "isAssigned": true,
                                    }
                                    updateData[broughtplan_field] = finalHEX;
                                    wixData.update(boughtPlan.collectionId, updateData).then(() => {
                                    })
                                    .catch((err) => {
                                    });

                           }).catch( (error) => {
                            let errorMsg = error.message;
                            let code = error.code;
                          } );
                       return ok();                       
}
// ******************************************//
//*********** Code for save order ********** //
// ******************************************//
 async function saveOrder(i,response,emailID,name,prefix,finalHEX,planName){
      let options = {"suppressAuth": true}; 
      let AlreadyOrderSts =   await wixData.query('orderData').eq('subscriptionId', response.items[i].subscriptionId).find(options);
      if(AlreadyOrderSts.length>0)
      {
        return false;
      }
      
      let SubScriptionInfo = await getSubscription(response.items[i].subscriptionId);
      let recurringIntervalvalue;
      if(response.items[i].recurringChargeSettings.recurringInterval === "MONTH" ){
        recurringIntervalvalue = response.items[i].recurringChargeSettings.recurringIntervalCount + " MONTH";
      }
      else{
        recurringIntervalvalue = response.items[i].recurringChargeSettings.recurringInterval;
      }
      let orderInfo = {
                    "subscriptionId": response.items[i].subscriptionId,
                    "planName":planName,
                    "planPrefix":prefix,
                    "email":emailID,
                    "name": name,
                    "hexKey": finalHEX,
                    "startDate": new Date(),
                    "subscriptionStatus" : SubScriptionInfo.status,
                    "paymentCycle": [{
                        'Purchased on': SubScriptionInfo.created,
                        'next charge':SubScriptionInfo.nextCharge
                    }],
                    "orignalHexCode": prefix+''+finalHEX,
                    "lastPaymentDate" : new Date(),
                    "subscriptionInfo" : SubScriptionInfo,
                    "orderInfo": response.items[i],
                    "annualPaymentMonthlyPayment": recurringIntervalvalue,
                    "paymentsReceived": SubScriptionInfo.orders.length
                 }
      //console.log('orderInfo',orderInfo);
      wixData.insert("orderData", orderInfo,options);
  }
  async function saveOrder_forApp(i,response,emailID,name,prefix,finalHEX,planName){
      let options = {"suppressAuth": true}; 
      // let AlreadyOrderSts =   await wixData.query('orderData').eq('subscriptionId', response.items[i].subscriptionId).find(options);
      // if(AlreadyOrderSts.length>0)
      // {
      //   return false;
      // }
      
     // let SubScriptionInfo = await getSubscription(response.items[i].subscriptionId);
      // let recurringIntervalvalue;
      // if(response.items[i].recurringChargeSettings.recurringInterval === "MONTH" ){
      //   recurringIntervalvalue = response.items[i].recurringChargeSettings.recurringIntervalCount + " MONTH";
      // }
      // else{
      //   recurringIntervalvalue = response.items[i].recurringChargeSettings.recurringInterval;
      // }
      let orderInfo = {
                    "subscriptionId": '',
                    "planName":planName,
                    "planPrefix":prefix,
                    "email":emailID,
                    "name": name,
                    "hexKey": finalHEX,
                    "startDate": new Date(),
                    "subscriptionStatus" : '',
                    "paymentCycle": '',
                    "orignalHexCode": prefix+''+finalHEX,
                    "lastPaymentDate" : new Date(),
                    "subscriptionInfo" : '',
                    "orderInfo": response.items[i],
                    "annualPaymentMonthlyPayment": '',
                    "paymentsReceived": response.total
                 }
      //console.log('orderInfo',orderInfo);
      wixData.insert("orderData", orderInfo,options);
  }
// *****************************************************//
//*********** Code for Send HEX mail on initial order ********** //
// *****************************************************//
async function SendHexMail(email,name,finalHEX,order_number,item_name) {
       // console.log('finalHEX2',finalHEX);
        let result = await ContactCreateWix(name,email);
        //console.log('finalHEX',finalHEX);
        triggeredEmails.emailContact('SrIzgG8', result._id, {
                variables: {
                    'hexCode': finalHEX,
                    'orderNo': order_number,
                    'name': name,
                    'planName':item_name,
                    'product': item_name,
                    'item-name':item_name
                }
                } );
  }
// *****************************************************//
//*********** Send mail Without HEX code on initial order ********** //
// *****************************************************//
async function SendWithoutHexMail(email,name,finalHEX,order_number,item_name) {
        let result = await ContactCreateWix(name,email);
        triggeredEmails.emailContact('T9VzHfA', result._id, {
                variables: {
                    'name': name,
                    'orderNumber': order_number,
                    'planName': item_name,
                    'orderNo': order_number,
                    'orderNo.': order_number,
                    'item-name': item_name,
                    'contact.Name.First':name,
                    'hexCode': finalHEX,
                    'ordernumber': order_number
                }
                } );
  }
// *****************************************************//
//*********** Code for Get Subscription Info ********** //
// *****************************************************//
  function getSubscription(subscriptionId){
        const options = {
         method: 'GET',
         headers: {"Accept": 'application/json', 'Authorization': 'Bearer secret_giRY2sd1CbXFDmRqn8wVEYyAFi6h9Uqu'}
       };
       return fetch("https://app.ecwid.com/api/v3/71163353/subscriptions/"+subscriptionId, options)
        .then( (httpResponse) => {
          if (httpResponse.ok) {
            return httpResponse.json();
          } else {
            return Promise.reject("Fetch did not succeed");
          }
        } )
        .then(subscripton_response =>subscripton_response)
        .catch(err => console.log(err));
  }

 function ContactCreateWix(name,email){
   const contactInfo = {
        name: {
          first: name,
          last: ""
        },
        emails: [
          {
            tag: "HOME",
            email: email,
            primary: true
          }
        ]
      };
    const options = {
    allowDuplicates: true,
    suppressAuth: true
  };
  
  return contacts.createContact(contactInfo,options);
 }

function getOrderdetail(orderID){
     const options = {
         method: 'GET',
         headers: {"Accept": 'application/json', 'Authorization': 'Bearer secret_giRY2sd1CbXFDmRqn8wVEYyAFi6h9Uqu'}
       };    
   return fetch("https://app.ecwid.com/api/v3/71163353/orders/"+orderID, options)
  .then( (httpResponse) => {
    if (httpResponse.ok) {
       return httpResponse.json();
    } else {
      return Promise.reject("Fetch did not succeed");
    }
  } )
  .then(response => response)
  .catch(err => console.log(err));
 }

 async function sentApp_OrderMails(i,response)
{
     //console.log('productName_30_april_24_2',response);
     // console.log('productName_1_may_sku',response.items[i].sku);
         const name1 = 'app-11',
          name2 = 'app-88',
          name3 = 'app-99';
         
         let productSKU = response.items[i].sku.toLowerCase(); 
         let plan = '';
      //   console.log('productSKU',productSKU);
         let cartContainsSpecificProduct = productSKU.includes(name1) || productSKU.includes(name2) || productSKU.includes(name3);
       
         if (cartContainsSpecificProduct==true) {
             if (productSKU.includes(name1)) {
                 plan = name1;
             }
              if (productSKU.includes(name2)) {
                plan = name2;
            }
            if (productSKU.includes(name3)) {
                plan = name3;
            }
         }
      
      let preferences = [{
        name: 'app-11',
        collectionId: 'App-11',
        prefix: '3A-11-7@XA-',
        field: 'hex'
    },
    {
        name: 'app-88',
        collectionId: 'App-88',
        prefix: '3A-88-7@XA-',
        field: 'hex'
    },
    {
        name: 'app-99',
        collectionId: 'App-99',
        prefix: '3A-99-7@XA-',
        field: 'hex'
    }
];
      let boughtPlan = preferences.find(any => any.name === plan);
      //console.log('boughtPlan',boughtPlan);
      let RESULTS;var finalHEX; let userId;let owner;
        
      wixData.query(boughtPlan.collectionId).ne('isAssigned', true).isNotEmpty(boughtPlan.field)
                     .find()
                     .then((res) => {
                          if(res.length>0){
                         // console.log('productName_12_may_res_length',res);
                          RESULTS = res.items[0];
                          finalHEX = RESULTS[boughtPlan.field];
                          owner = RESULTS._owner;
                          } else {
                          //console.log('productName_1_may_not_found',res.items[0]);
                          finalHEX = 'email robmazemfg@gmail.com for hex code';
                          SendWithoutHexMail(response.email,response.billingPerson.name,boughtPlan.prefix+''+finalHEX,response.id,response.items[i].name);
                          finalHEX = '';
                          saveOrder_forApp(i,response,response.email,response.billingPerson.name,boughtPlan.prefix,finalHEX,boughtPlan.name)
                          return ok();
                          }
                        //  console.log('productName_1_may_111',finalHEX);
                          SendHexMail(response.email,response.billingPerson.name,boughtPlan.prefix+''+finalHEX,response.id,response.items[i].name);
                          saveOrder_forApp(i,response,response.email,response.billingPerson.name,boughtPlan.prefix,finalHEX,boughtPlan.name)
 
                               var broughtplan_field = boughtPlan.field;
                               let updateData = {
                                        "_id": RESULTS._id,
                                        "isAssigned": true,
                                    }
                                    updateData[broughtplan_field] = finalHEX;
                                    wixData.update(boughtPlan.collectionId, updateData).then(() => {
                                    })
                                    .catch((err) => {
                                    });

                           }).catch( (error) => {
                            let errorMsg = error.message;
                            let code = error.code;
                          } );
                       return ok();                       
}

  

  



