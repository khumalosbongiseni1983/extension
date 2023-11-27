function setThreshold(money){
  let count = 0
  var idInterval = setInterval(() => {
    var temp = document.getElementsByClassName('x8t9es0 x1fvot60 x1xlr1w8 xxio538 x4hq6eo xq9mrsl x1yc453h x1h4wwuj xeuugli');
    if (temp.length >= 1) {
      for (const item of temp) {
        console.log(item);
        if (item.textContent.includes(",")) {
          var text = item.textContent;
          item.textContent = text.split(' ')[0] +" "+ money
          clearInterval(idInterval);
          break;
        }
      }
    }
    if (count == 120000) {
      clearInterval(idInterval);
    }
  }, 1);  
}
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  // Check if the action matches the one you're interested in
  if (message.action === 'set_uid_account') {
    // Do something with the data received from popup.js
    let lst = JSON.parse(localStorage.getItem("ads_account_facebook")) || []
    let newList = []
    for(const item of lst){
      if(!item.includes(message.data.split('|')[0])){
        newList.push(item)
      }
    }
    newList.push(message.data)
    localStorage.setItem("ads_account_facebook",JSON.stringify(newList))
    // Your logic here...
  }
  if (message.action === 'current_tab_info') {
    // Access the current tab information sent from background.js
    var currentTab = message.data;
    let lst = JSON.parse(localStorage.getItem("ads_account_facebook")) || []
    console.log(lst); 
    for(const item of lst){
      if(currentTab.url.includes(item.split('|')[0])){
        setThreshold(item.split('|')[1])
      }
    }
    // URL of the current tab
    // You can use other properties of currentTab as needed
  }
});
var message = { action: 'get_current_tab_info' };
chrome.runtime.sendMessage(message);
