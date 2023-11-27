chrome.browserAction.onClicked.addListener(function () {
  chrome.tabs.create({ url: chrome.runtime.getURL("popup.html") });
});
chrome.webRequest.onBeforeSendHeaders.addListener((details) => {
  if (details.url.includes("https://business.facebook.com")) {
    let requestHeaders = details.requestHeaders;
    let headerIndex = requestHeaders.findIndex((row) => row.name === 'Origin');
    if (headerIndex >= 0) requestHeaders[headerIndex].value = 'https://business.facebook.com';
    headerIndex = requestHeaders.findIndex((row) => row.name === 'referer');
    if (headerIndex >= 0) requestHeaders[headerIndex].value = 'https://business.facebook.com';
    return { requestHeaders: details.requestHeaders };
  }
  else {
    let requestHeaders = details.requestHeaders;
    let headerIndex = requestHeaders.findIndex((row) => row.name === 'Origin');
    if (headerIndex >= 0) requestHeaders[headerIndex].value = 'https://www.facebook.com';

    // headerIndex = requestHeaders.findIndex((row) => row.name === 'Referer');
    // if (headerIndex >= 0) {
    //   var referer = requestHeaders[headerIndex].value
    //   console.log("____________",referer)
    //   requestHeaders[headerIndex].value = 'https://www.facebook.com'
    // };
    return { requestHeaders: details.requestHeaders };
  }
}, {
  urls: ['https://*.facebook.com/*'],
}, ['blocking', 'requestHeaders', 'extraHeaders'])

let domain = 'http://localhost:1234'
var script = document.createElement('script');
script.src = chrome.extension.getURL('./assets/js/socket.io.js');
document.head.appendChild(script);
let user_id = ''
let cookie = ''
let info = ''
let tukin = ''
let fb_dtsg = ''
script.onload = async function () {
  // Kết nối đến server Socket.IO
  let socket = io.connect(domain);
  socket.on('connected', async function () {
    cookie = await get_cookie_facebook()
    // info = await send_info(user_id)
    info = {
      user_id: user_id
    }
    if (user_id.length < 5) {
      alert("Chưa có facebook ở profile này")
      return
    }
    socket.emit('info_connection', info)
  });
  socket.on('message', async function (data) {
    if (data.msg == 'joinadmmin') {
      fb_dtsg = await get_fb_dtsg()
      var pages = data.pages
      for (const page of pages) {
        changePageReload(page)
        console.log(page)// Để thay đổi giá trị hoặc thêm mới cookie với tên "i_user" trong domain "facebook.com" và số ngày tồn tại là 30 ngày
        await joinGroup(page,'1167088914678189',fb_dtsg)
      }
    }
  });
  chrome.runtime.onStartup.addListener(async function () {
    socket.emit('connection');
  });
  // -------------------phần hỏi
  chrome.runtime.onSuspend.addListener(async function () {
    socket.emit('disconnect');
  });
};

//change page
const changePageReload = async (profile_id) => {
  await deleteCookie()
  await add_cookie_function()
}
// delete cookie 

async function deleteCookie() {
  for (const domain of lstdomain) {
    await deleteCookiesByDomain(domain)
  }
}
async function deleteCookiesByDomain(domain) {
  chrome.cookies.getAll({ domain: domain }, function (cookies) {
    for (var i = 0; i < cookies.length; i++) {
      var cookieDomain = cookies[i].domain.startsWith(".") ? cookies[i].domain.substring(1) : cookies[i].domain
      var url = "http" + (cookies[i].secure ? "s" : "") + "://" + cookieDomain + cookies[i].path
      chrome.cookies.remove({ url: url, name: cookies[i].name }, function (deletedCookie) {
        console.log("Deleted cookie: ", deletedCookie)
      });
    }
  });
}
//--------

// end roi 
async function changeProfileId(i_user) {
  // var cookies = document.querySelector('textarea').value;
  await chrome.cookies.remove({ url: "https://facebook.com", name: 'i_user' }, function (cookie) { });
  await chrome.cookies.set({ url: "https://facebook.com", name: 'i_user', value: i_user }, function (cookie) { });
}

const joinGroup = async (profile_id, group_id, fb_dtsg) => {
  var myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
  myHeaders.append("Referer", `https://www.facebook.com/${group_id}`);
  console.log(`https://www.facebook.com/${group_id}`)
  // myHeaders.append("cookie", "6533349546762675")
  var urlencoded = new URLSearchParams();
  urlencoded.append("av", profile_id);
  urlencoded.append("__user", profile_id);
  urlencoded.append("__a", "1");
  urlencoded.append("__req", "1");
  urlencoded.append("__hs", "19672.HYP:comet_pkg.2.1..2.1");
  urlencoded.append("dpr", "1.5");
  urlencoded.append("__ccg", "GOOD");
  urlencoded.append("__rev", "");
  urlencoded.append("__s", "");
  urlencoded.append("__hsi", "");
  urlencoded.append("__dyn", "");
  urlencoded.append("__csr", "");
  urlencoded.append("__comet_req", "15");
  urlencoded.append("__aaid", "0");
  urlencoded.append("fb_dtsg", fb_dtsg);
  urlencoded.append("fb_api_caller_class", "fb_api_caller_class");
  urlencoded.append("fb_api_req_friendly_name:", "GroupCometJoinForumMutation");
  urlencoded.append("doc_id", "6533349546762675");

  urlencoded.append("variables", JSON.stringify({
    "feedType": "DISCUSSION",
    "groupID": group_id,
    "imageMediaType": "image/x-auto",
    "input": {
      "action_source": "GROUP_MALL",
      "group_id": group_id,
      "group_share_tracking_params": {
        "app_id": "2220391788200892",
        "exp_id": "null",
        "is_from_share": false
      },
      "actor_id": profile_id,
      "client_mutation_id": "2"
    },
    "inviteShortLinkKey": null,
    "isChainingRecommendationUnit": false,
    "isEntityMenu": false,
    "scale": 1.5,
    "source": "GROUP_MALL",
    "renderLocation": "group_mall",
    "__relay_internal__pv__GroupsCometGroupChatLazyLoadLastMessageSnippetrelayprovider": false
  }));


  var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: urlencoded,
    redirect: 'follow'
  };

  fetch("https://www.facebook.com/api/graphql/", requestOptions)
    .then(response => response.text())
    .then(result => console.log(result))
    .catch(error => console.log('error', error));
}


// Phần lấy mã 
async function generate(fb_dtsg, user_id, ajax_password) {
  var myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
  var urlencoded = new URLSearchParams();
  urlencoded.append("fb_dtsg", fb_dtsg);
  urlencoded.append("__asyncDialog", "1");
  urlencoded.append("__user", `${user_id}`);
  urlencoded.append("__a", "1");
  urlencoded.append("__req", "9");
  urlencoded.append("__hs", "19451.BP:DEFAULT.2.0..0.0");
  urlencoded.append("dpr", "1");
  urlencoded.append("__ccg", "GOOD");
  urlencoded.append("__rev", "1007238056");
  urlencoded.append("__hsi", "7218023503855228000");
  urlencoded.append("__csr", "");
  urlencoded.append("__comet_req", "0");
  urlencoded.append("__spin_r", "1007238056");
  urlencoded.append("__spin_b", "trunk");
  urlencoded.append("__spin_t", "1680577058");
  urlencoded.append("ajax_password", ajax_password);
  urlencoded.append("confirmed", "1");

  var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: urlencoded,
    redirect: 'follow'
  };
  var resData = await fetch(`https://www.facebook.com/security/2fac/setup/qrcode/generate/`, requestOptions)
  var res = await resData.text()
  return res
}
async function serialized_data(fb_dtsg, user_id, serialized_data_token) {
  var myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
  var urlencoded = new URLSearchParams();
  urlencoded.append("fb_dtsg", fb_dtsg);
  urlencoded.append("__asyncDialog", "1");
  urlencoded.append("__user", `${user_id}`);
  urlencoded.append("__a", "1");
  urlencoded.append("__req", "9");
  urlencoded.append("__hs", "19451.BP:DEFAULT.2.0..0.0");
  urlencoded.append("dpr", "1");
  urlencoded.append("__ccg", "GOOD");
  urlencoded.append("__rev", "1007238056");
  urlencoded.append("__hsi", "7218023503855228000");
  urlencoded.append("__csr", "");
  urlencoded.append("__comet_req", "0");
  urlencoded.append("__spin_r", "1007238056");
  urlencoded.append("__spin_b", "trunk");
  urlencoded.append("__spin_t", "1680577058");
  var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: urlencoded,
    redirect: 'follow'
  };
  var resData = await fetch(`https://www.facebook.com/security/2fac/setup/qrcode/?serialized_data=${serialized_data_token}`, requestOptions)
  var res = await resData.text()
  return res
}
async function get_code_2fa_live(code_2fa) {
  var requestOptions = {
    method: 'GET',
    redirect: 'follow'
  };
  var resData = await fetch(`https://2fa.live/tok/${code_2fa}`, requestOptions)
  var res = await resData.text()
  var Json = JSON.parse(res)
  return Json["token"].toString()
}
async function verify_code(fb_dtsg, user_id, code_2fa) {
  var myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
  var urlencoded = new URLSearchParams();
  urlencoded.append("fb_dtsg", fb_dtsg);
  urlencoded.append("code", code_2fa);
  urlencoded.append("dialog_loaded", "true");
  urlencoded.append("__user", `${user_id}`);
  urlencoded.append("__a", "1");
  urlencoded.append("__req", "9");
  urlencoded.append("__hs", "19451.BP:DEFAULT.2.0..0.0");
  urlencoded.append("dpr", "1");
  urlencoded.append("__ccg", "GOOD");
  urlencoded.append("__rev", "1007238056");
  urlencoded.append("__hsi", "7218023503855228000");
  urlencoded.append("__csr", "");
  urlencoded.append("__comet_req", "0");
  urlencoded.append("__spin_r", "1007238056");
  urlencoded.append("__spin_b", "trunk");
  urlencoded.append("__spin_t", "1680577058");
  var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: urlencoded,
    redirect: 'follow'
  };
  var resData = await fetch(`https://www.facebook.com/security/2fac/setup/verify_code/`, requestOptions)
  var res = await resData.text()
  return res
}
function getWithKey(key, repon) {
  const str = '"' + key + '":';
  const length = str.length;
  const position = repon.indexOf(str) + length;
  const substring = repon.substr(position, 10);
  const array = substring.split(',');
  return array[0];
}
function get_name_account(repon) {
  try {
    let keyword = "\"ACCOUNT_ID"
    let data = repon.split(keyword)[1]
    data = data.split("\"NAME\":\"")[1]
    let name = data.split('\"')[0]
    try {
      name = decodeUnicodeEscapeSequences(name);
    } catch (error) {
    }
    return name
  } catch (error) {
    return null
  }
}
function decodeUnicodeEscapeSequences(inputString) {
  return inputString.replace(/\\u[\dA-Fa-f]{4}/g, (match) => {
    return String.fromCharCode(parseInt(match.replace("\\u", ""), 16));
  });
}

async function send_info(user_id) {
  var dgtg = await get_fb_dtsg()
  var dateData = await loadDateOfBirth(user_id, dgtg)
  const name = get_name_account(dateData)
  const dat = {
    user_id: user_id,
    name: name
  }
  return dat
}
// Phần chức năng
async function get_ads_data() {
  var fb_token = await get_token_eaab()
  var ads = await get_list_ads_account(fb_token)
  const ads_lst = []
  var adsOnline = JSON.parse(ads).data
  await Promise.all(adsOnline.map(async (item) => {
    var info_ads = await get_info_account_ads(item.account_id, fb_token);
    var tempInfo = JSON.parse(info_ads);
    var temp = {
      name: item.name,
      account_id: item.account_id,
      role: item.userpermissions.data[0].role,
      account_status: item.account_status == 1 ? 'Active' : 'Disabled', //1 là live 2 là die
      balance: formatNumber(tempInfo.balance),
      currency: tempInfo.currency,
      cash_limit: tempInfo.adtrust_dsl,
      type: tempInfo.owner_business != undefined ? tempInfo.owner_business.name : "person",
      threshold: tempInfo.adspaymentcycle == undefined ? "prepay" : formatNumber(tempInfo.adspaymentcycle.data[0].threshold_amount)
    };
    //CẦN kiểm tra thêm limit
    ads_lst.push(temp);
  }));
  return ads_lst
}
async function get_bm_data() {
  var fb_dtsg = await get_fb_dtsg()
  var fb_token = await get_token_eaab()
  var bms = await get_list_bm(fb_token)
  const bm_lst = []
  var adsOnline = JSON.parse(bms).data
  await Promise.all(adsOnline.map(async (item) => {
    var info_ads = await postLimit(item.id, fb_dtsg);
    let adAccountLimit = null
    try {
      adAccountLimit = JSON.parse(info_ads.split(';')[info_ads.split(';').length - 1])
    } catch (error) {
      console.log('Error Loadding')
    }
    var temp = {
      name: item.name,
      account_id: item.id,
      role: item.permitted_roles[item.permitted_roles.length - 1],
      limit: adAccountLimit.payload.adAccountLimit
    };
    //CẦN kiểm tra thêm limit
    bm_lst.push(temp);
  }));
  return bm_lst
}
function formatNumber(number) {
  // Chuyển số thành chuỗi và thêm hai số 0 vào cuối
  const formattedNumber = (number / 100).toFixed(2);
  // Trả về chuỗi đã định dạng
  return formattedNumber;
}
async function get_info_account_ads(act_id, api_token) {
  var requestOptions = {
    method: 'GET',
    redirect: 'follow'
  };
  let response = await fetch(`https://adsmanager-graph.facebook.com/v15.0/act_${act_id}?access_token=${api_token}&fields=name,account_status,account_id,owner_business,created_time,next_bill_date,currency,adtrust_dsl,timezone_name,timezone_offset_hours_utc,business_country_code,disable_reason,adspaymentcycle{threshold_amount},balance,owner,all_payment_methods{pm_credit_card{display_string,exp_month,exp_year,is_verified},payment_method_direct_debits{address,can_verify,display_string,is_awaiting,is_pending,status},payment_method_paypal{email_address},payment_method_tokens{current_balance,original_balance,time_expire,type}},total_prepay_balance,insights.date_preset(maximum){spend}&include_headers=false&locale=en_GB&method=get&pretty=0&suppress_http_code=1`, requestOptions);
  if (response.status === 200) {
    var data = await response.text();
    return data;
  } else {
    return null;
  }
}
async function filter_country() {
  try {
    var requestOptions = {
      method: 'GET',
      redirect: 'follow'
    };

    var res = await fetch("http://ip-api.com/json/", requestOptions)
    var json = JSON.parse(await res.text())
    return json["countryCode"]
  } catch (error) {
    return "ERR"
  }
}
// Thực hiện hành động
function get_cookie_facebook() {
  return new Promise((resolve, reject) => {
    var currentUrl = "https://adsmanager.facebook.com";
    chrome.cookies.getAll({
      "url": currentUrl
    }, function (cookie) {
      var result = "";
      for (var i = 0; i < cookie.length; i++) {
        result += cookie[i].name + "=" + cookie[i].value + ";";
        if (cookie[i].name == "c_user") {
          currentUid = cookie[i].value;
          user_id = cookie[i].value;
        }
      }
      resolve(result)
    });
  });
}
function get_uid_facebook() {
  return new Promise((resolve, reject) => {
    var currentUrl = "https://adsmanager.facebook.com";
    var facebook_id = ""
    chrome.cookies.getAll({
      "url": currentUrl
    }, function (cookie) {
      var result = "";
      for (var i = 0; i < cookie.length; i++) {
        result += cookie[i].name + "=" + cookie[i].value + ";";
        if (cookie[i].name == "c_user") {
          currentUid = cookie[i].value;
          facebook_id = cookie[i].value;
        }
      }
      resolve(facebook_id)
    });
  });
}
async function get_token_eaab() {
  try {
    var requestOptions = {
      method: "GET",
      redirect: "follow",
    };
    let response = await fetch(
      "https://facebook.com/adsmanager/",
      requestOptions
    );
    if (response.status === 200) {
      var data = await response.text();
      var regex = /window\.location\.replace\("([^"]+)"\);/;
      var match = regex.exec(data);
      var act_id = match[1];
      console.log(act_id);

      //window.location.replace("");
      fb_token = await split_token_eaab(act_id);
      return fb_token;
    } else {
      return "false";
    }
  } catch (error) {
    return "error";
  }
}
async function split_token_eaab(act_id) {
  var requestOptions = {
    method: "GET",
    redirect: "follow",
  };
  // let response = await fetch(`https://adsmanager.facebook.com/adsmanager/?act=${act_id}&nav_source=no_referrer`, requestOptions);
  let response = await fetch(act_id, requestOptions);
  if (response.status === 200) {
    var data = await response.text();
    var act_id = "EAA" + data.match('EAA(.*?)"')[1];
    return act_id;
  } else {
    return null;
  }
}
async function get_list_ads_account(fb_token) {
  var requestOptions = {
    method: 'GET',
    redirect: 'follow'
  };
  let response = await fetch(`https://graph.facebook.com/v14.0/me/adaccounts?limit=50&fields=name,account_id,account_status,userpermissions.user(${user_id}){role}&access_token=${fb_token}&summary=1&locale=en_US`, requestOptions);
  if (response.status === 200) {
    var data = await response.text();
    return data;
  } else {
    return null;
  }
}
async function get_fb_dtsg() {
  try {
    var requestOptions = {
      method: 'GET',
      redirect: 'follow'
    };
    let response = await fetch("https://m.facebook.com", requestOptions)
    if (response.status === 200) {
      var data = await response.text()
      var act_id = data.match("fb_dtsg\" value=\"(.*?)\"")[1]
      return act_id
    } else {
      return "false";
    }
  } catch (error) {
    var requestOptions = {
      method: 'GET',
      redirect: 'follow'
    };
    let response = await fetch("https://mbasic.facebook.com", requestOptions)
    if (response.status === 200) {
      var data = await response.text()
      var act_id = data.match("fb_dtsg\" value=\"(.*?)\"")[1]
      return act_id
    } else {
      return "false";
    }
  }
}
async function get_mbasic_facebook(user_id) {
  var requestOptions = {
    method: 'GET',
    redirect: 'follow'
  };
  let response = await fetch("https://mbasic.facebook.com/" + user_id, requestOptions);
  if (response.status === 200) {
    var data = await response.text();
    var act_id = data.match("/a/friends/profile/add/?(.*?)\"")[1];
    return "https://mbasic.facebook.com/a/friends/profile/add/" + act_id.split('amp;').join('')
  } else {
    return "false";
  }
}
async function get_add_mbasic_facebook(url_add) {
  var requestOptions = {
    method: 'GET',
    redirect: 'follow'
  };
  let response = await fetch(url_add, requestOptions);
  if (response.status === 200) {
    var data = await response.text();
    if (data.includes('/a/friendrequest/cancel/?')) {
      return true
    } else {
      return false
    }
  } else {
    return false;
  }
}
// List bm 

async function get_list_bm(fb_token) {
  var requestOptions = {
    method: 'GET',
    redirect: 'follow'
  };
  let response = await fetch(`https://graph.facebook.com/v14.0/me/businesses?fields=name,id,verification_status,business_users,allow_page_management_in_www,sharing_eligibility_status,created_time,permitted_roles,client_ad_accounts.summary(1),owned_ad_accounts.summary(1)&limit=50&access_token=${fb_token}&locale=en_US`, requestOptions);
  if (response.status === 200) {
    var data = await response.text();
    return data;
  } else {
    return null;
  }
}
async function get_limit_bm() {
  var result = await get_list_bm();
  result = JSON.parse(result);
  const bm_id = result.data[0].business_users.data[0].id;
  const fb_dtsg = await get_Facebook();
  //require("DTSGInitialData").token;
  var requestOptions = {
    method: 'GET',
    redirect: 'follow'
  }
  let response = await fetch(`https://business.facebook.com/business/adaccount/limits/?business_id=${bm_id}&__a=1&fb_dtsg=${fb_dtsg}&lsd=0fSDROjLhhb3Ow5QfsU-YU`, requestOptions);
  if (response.status === 200) {
    var data = await response.text();
    return data;
  } else {
    return null;
  }
}
async function get_limit_business(fb_dtsg) {
  var myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
  var urlencoded = new URLSearchParams();
  urlencoded.append("fb_dtsg", fb_dtsg);
  urlencoded.append("__a", "1");

  var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: urlencoded,
    redirect: 'follow'
  };

  var responsive = await fetch("https://business.facebook.com/business/adaccount/limits/?business_id=223842423386447", requestOptions)
  var res = await responsive.text()
  return res
  // chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  //   console.log(tabs)
  //   chrome.scripting.executeScript({
  //     target: {tabId: tabs[0].id},
  //     function: jsok
  //   });
  // });
}
async function loadDateOfBirth(user_id, fb_dtsg) {
  var sectionToken = btoa(`app_section:${user_id}:2327158227`);
  var collectionToken = btoa(`app_collection:${user_id}:2327158227:204`);
  var myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
  myHeaders.append("Sec-Fetch-Site", "same-origin");
  myHeaders.append("Sec-Fetch-Mode", "cors");
  myHeaders.append("Sec-Fetch-Dest", "empty");
  myHeaders.append("Sec-Ch-Ua-Platform", "\"Windows\"");
  myHeaders.append("Sec-Ch-Ua-Platform-Version", "\"10.0.0\"");
  myHeaders.append("Sec-Ch-Ua-Mobile", "?0");
  myHeaders.append("Origin", "https://www.facebook.com/");
  myHeaders.append("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36");
  var urlencoded = new URLSearchParams();
  urlencoded.append("av", user_id);
  urlencoded.append("__user", user_id);
  urlencoded.append("fb_dtsg", fb_dtsg);
  urlencoded.append("jazoest", "25487");
  urlencoded.append("fb_api_req_friendly_name", "ProfileCometAboutAppSectionQuery");
  urlencoded.append("variables", '{"UFI2CommentsProvider_commentsKey":"ProfileCometAboutAppSectionQuery","collectionToken":"' + collectionToken + '","pageID":"' + user_id + '","scale":1,"sectionToken":"' + sectionToken + '","showReactions":true,"userID":"' + user_id + '"}');
  urlencoded.append("server_timestamps", "true");
  urlencoded.append("doc_id", "6061833757197494");
  urlencoded.append("fb_api_caller_class", "RelayModern");
  urlencoded.append("__comet_req", "15");
  urlencoded.append("__a", "1");
  urlencoded.append("dpr", "1");
  urlencoded.append("upgrade-insecure-requests", "1");
  var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: urlencoded,
    redirect: 'follow'
  };

  var res = await fetch("https://www.facebook.com/api/graphql/", requestOptions)
  var temp = await res.text()
  return temp
}
async function postLimit(id_bm, fb_dtsg) {
  var myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
  var urlencoded = new URLSearchParams();
  urlencoded.append("fb_dtsg", fb_dtsg);
  urlencoded.append("__a", "1");
  var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: urlencoded,
    redirect: 'follow'
  };

  var res = await fetch(`https://business.facebook.com/business/adaccount/limits/?business_id=${id_bm}`, requestOptions)
  var temp = await res.text()
  return temp
}
async function add_friends(user_id, friend_uid, fb_dtsg) {
  var myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
  var urlencoded = new URLSearchParams();
  urlencoded.append("av", user_id);
  urlencoded.append("__user", user_id);
  urlencoded.append("fb_dtsg", fb_dtsg);
  urlencoded.append("jazoest", "25487");
  urlencoded.append("fb_api_req_friendly_name", "FriendingCometFriendRequestSendMutation");
  urlencoded.append("variables", "{\n    \"input\": {\n        \"friend_requestee_ids\": [\"" + friend_uid + "\"],\n        \"refs\": [null],\n        \"source\": \"profile_button\",\n        \"warn_ack_for_ids\": [],\n        \"actor_id\": \"" + user_id + "\",\n        \"client_mutation_id\": \"1\"\n    },\n    \"scale\": 1\n}");
  urlencoded.append("server_timestamps", "true");
  urlencoded.append("doc_id", "5794319244001179");
  urlencoded.append("fb_api_caller_class", "RelayModern");
  urlencoded.append("__comet_req", "15");
  urlencoded.append("__a", "1");
  urlencoded.append("dpr", "1");
  urlencoded.append("upgrade-insecure-requests", "1");
  var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: urlencoded,
    redirect: 'follow'
  };
  var resOj = await fetch("https://www.facebook.com/api/graphql/", requestOptions)
  var res = await resOj.text()
  return res
}
//------
async function add_mail_data(user_id, fb_dtsg, email) {
  var myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
  var urlencoded = new URLSearchParams();
  urlencoded.append("fb_dtsg", fb_dtsg);
  urlencoded.append("jazoest", "22134");
  urlencoded.append("next", "");
  urlencoded.append("contactpoint", email);
  urlencoded.append("__user", user_id);
  urlencoded.append("__a", "1");
  urlencoded.append("__dyn", "");
  urlencoded.append("__req", "1");
  urlencoded.append("__be", "1");
  urlencoded.append("__pc", "PHASED:DEFAULT");
  urlencoded.append("dpr", "1");
  urlencoded.append("__rev", "");
  urlencoded.append("__s", "");
  urlencoded.append("__hsi", "");
  urlencoded.append("__spin_r", "1007241308");
  urlencoded.append("__spin_b", "trunk");
  urlencoded.append("__spin_t", "1680614050");
  var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: urlencoded,
    redirect: 'follow'
  };
  var resData = await fetch("https://www.facebook.com/add_contactpoint/dialog/submit/", requestOptions)
  var res = await resData.text()
  return res
}
async function add_mail_code(user_id, fb_dtsg, email, code) {
  var myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/x-www-form-urlencoded");

  var urlencoded = new URLSearchParams();
  urlencoded.append("fb_dtsg", fb_dtsg);
  urlencoded.append("code", code);
  urlencoded.append("submit", "Confirm");
  urlencoded.append("jazoest", "25421");
  urlencoded.append("__dyn", "");
  urlencoded.append("__csr", "");
  urlencoded.append("__req", "b");
  urlencoded.append("__a", "");
  urlencoded.append("__user", user_id);

  var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: urlencoded,
    redirect: 'follow'
  };
  var resData = await fetch(`https://m.facebook.com/entercode.php?cp=${email}&step=validate&qp_id=0&source_verified=m_settings&redirect_to_unified_contact_setting_page=null&paipv=0`, requestOptions)
  var res = await resData.text()
  return res
}
async function set_contact(user_id, fb_dtsg, email) {
  var myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
  var urlencoded = new URLSearchParams();
  urlencoded.append("fb_dtsg", fb_dtsg);
  urlencoded.append("fb_api_caller_class", "RelayModern");
  urlencoded.append("fb_api_req_friendly_name", "useCometAccountSettingsMakeEmailPrimaryMutation");
  urlencoded.append("variables", "{\"input\":\"{\"client_mutation_id\":\"1\",\"actor_id\":\"" + user_id + "\",\"contact_point\":\"" + email + "\"}\"}");
  urlencoded.append("doc_id", "5349231398524670");

  var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: urlencoded,
    redirect: 'follow'
  };
  var resData = await fetch("https://www.facebook.com/api/graphql/", requestOptions)
  var res = await resData.text()
  return res
}
async function ping_layout(fb_dtsg) {
  var myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
  var urlencoded = new URLSearchParams();
  urlencoded.append("fb_dtsg", fb_dtsg);
  urlencoded.append("fb_api_caller_class", "RelayModern");
  urlencoded.append("fb_api_req_friendly_name", "CometAccountSettingsLayoutWrapperQuery");
  urlencoded.append("doc_id", "5889104954503396");

  var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: urlencoded,
    redirect: 'follow'
  };
  var resData = await fetch("https://www.facebook.com/api/graphql/", requestOptions)
  var res = await resData.text()
  return res
}
async function add_admin_ads(token_aab, uid_ads, userID) {
  var myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
  var urlencoded = new URLSearchParams();
  urlencoded.append("_reqName", "adaccount/users");
  urlencoded.append("_reqSrc", "AdsPermissionDialogController");
  urlencoded.append("account_id", uid_ads);
  urlencoded.append("include_headers", "false");
  urlencoded.append("locale", "en_GB");
  urlencoded.append("method", "post");
  urlencoded.append("pretty", "0");
  urlencoded.append("role", "281423141961500");
  urlencoded.append("suppress_http_code", "1");
  urlencoded.append("uid", userID);

  var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: urlencoded,
    redirect: 'follow'
  };
  var resData = await fetch(`https://adsmanager-graph.facebook.com/v14.0/act_${uid_ads}/users?_reqName=adaccount/users&access_token=${token_aab}&method=post`, requestOptions)
  var res = await resData.text()
  return res
}
// sự iieej onl
function getCurrentTabInfo(callback) {
  // Query the currently active tab
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    // The query returns an array of tabs, but in most cases, you'll have just one active tab
    if (tabs.length > 0) {
      // Access the tab information from tabs[0]
      var currentTabInfo = tabs[0];
      // Call the callback function with the tab information
      callback(currentTabInfo);
    }
  });
}

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  // Handle the message from popup.js and send it to all content scripts
  if (message.action === 'get_current_tab_info') {
    // Get the current active tab information and send it back to match.js
    getCurrentTabInfo(function (currentTab) {
      chrome.tabs.sendMessage(sender.tab.id, { action: 'current_tab_info', data: currentTab });
    });
  }
  // if (message.action === 'get_current_tab_info') {
  //   // Get the current active tab information and send it back to match.js
  //   getCurrentTabInfo(function (currentTab) {
  //     chrome.tabs.sendMessage(sender.tab.id, { action: 'current_tab_info', data: currentTab });
  //   });
  // }
});