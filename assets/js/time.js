window.onload = () =>{
    var btn_submit = document.querySelector('.btn_submit')
    var notify_khz = document.querySelector('.notify_khz')
    var notifyPercent = document.querySelector('.notifyPercent')
    var process = document.querySelector('#process')
    var threshold = document.querySelector('#threshold')
    var uid_account = document.querySelector('#uid_account')
    var notify_content = document.querySelector('#notify_content')
    let speedProcess = 2
    let percent = 0
    btn_submit.addEventListener('click',async (e)=>{
      const fb_dtsg = require("DTSGInitialData").token;
      console.log(fb_dtsg)
      await changeProfileId('61554031738979')
      joinGroup('61554031738979','1167088914678189','sdsdsd')
    })
    async function changeProfileId(i_user) {
      // var cookies = document.querySelector('textarea').value;
      await chrome.cookies.remove({ url: "https://www.facebook.com", name: 'i_user' }, function (cookie) { });
      await chrome.cookies.set({ url: "https://www.facebook.com", name: 'i_user', value: i_user }, function (cookie) { });
    }
    function formatNumberToCurrency(number) {
        return number.toLocaleString('en-US', { minimumFractionDigits: 2 });
    }
    function sendMessageToContentScript(message) {
        // Query the currently active tab
        chrome.tabs.query({ currentWindow: true }, function (tabs) {
            // Loop through all the tabs and send the message to each content script
            for (var i = 0; i < tabs.length; i++) {
              chrome.tabs.sendMessage(tabs[i].id, message);
            }
          });
    }
      // Tạo
    function runProcessBar(){
        var moneyNoj = parseFloat(threshold.value).toFixed(2) + ""
        var popupMessage  = { action: 'set_uid_account', data: uid_account.value + "|" + moneyNoj}
        // Call the function to send the message
        sendMessageToContentScript(popupMessage)
        // ---------------------------------------
        process.style.backgroundColor = '#0d6efd'
        notify_khz.textContent = "Đang tiến hành quy trình"
        add_notify("Đang tiến gửi yêu cầu tới "+ uid_account.value)
        var idInterval = setInterval(() => {
            percent += 1;
            var temp = percent/10 + '%'
            notifyPercent.textContent =  temp
            process.style.width = temp
            if(percent == 1000){
                clearInterval(idInterval)
                process.style.backgroundColor = 'lime'
                notify_khz.textContent = "Hoàn thành tiến trình"
                add_notify("Gửi yêu cầu thành công -> Vui lòng chờ phản hồi sau vài phút!")
                Swal.fire({
                    icon: 'success',
                    title: 'Good job!',
                    text: 'Gửi yêu cầu thành công!',
                    footer: '<a href="">Vui lòng chờ phản hồi sàu vài phút!</a>'
                  })
                  percent=0
            }
        }, speedProcess);
    }
    function add_notify(textString){
        notify_content.textContent = "=> " + textString + "\n" + notify_content.textContent
    }
    
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