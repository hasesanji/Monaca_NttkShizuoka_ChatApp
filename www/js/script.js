// This is a JavaScript file

// 固定値オブジェクト
var CONST = {
    // Nifty Cloud Mobile Backendのアプリケーションキー，クライアントキー，ログインパスワード
    NCMB_APP : '1d20a06696915b4ff6aaf52ca7c3a0c7309d9e8e1685a1e5344231e0faa441f9',
    NCMB_CLI : 'f6ed8452b6053b67c6aebe64cbf52543bbe5f5ad5b18a6c55fec19050b15daf2',
    NCMB_PAS : '1068183205366',
    // Web SQL Databaseのデータベース名，バージョン，表示名，サイズ，テーブル作成
    DB_NAME : 'localdb',
    DB_VERSION : '1.0',
    DB_DISPLAY : 'webdb',
    DB_SIZE : 4 * 1024 * 1024,
    // localStorageのUUID,表示名,最終更新日
    LS_LUID : 'LOGIN_USER',
    LS_NAME : 'DISPLAY_NAME',
    LS_LUPD : 'LAST_UPDATE',
    // MessageRepositoryの名前,ID,表示名,メッセージ,日時
    MR_STORE : 'MessageRepository',
    MR_ID : 'userId',
    MR_NAME : 'displayName',
    MR_TEXT : 'messageText',
    MR_DATE : 'messageDate'
};


// Nifty Cloud Mobile Backendのオブジェクト
var ncmb = new NCMB(CONST.NCMB_APP, CONST.NCMB_CLI);


// コンソールっぽいオブジェクト
var debug = {};
debug.log = [];
debug.time = function() {
    var now = new Date;
    var logTime = 'hh:mm:ss';
    logTime = logTime.replace(/hh/g, ('0' + now.getHours()).slice(-2));
    logTime = logTime.replace(/mm/g, ('0' + now.getMinutes()).slice(-2));
    logTime = logTime.replace(/ss/g, ('0' + now.getSeconds()).slice(-2));
    return logTime.toString();
};
// ログに追加（正常）
debug.add = function(argText) {
    console.log(argText);
    debug.log[debug.log.length] = debug.time() + ' o ' + argText;
};
// ログに追加（エラー）
debug.adde = function(argText) {
    console.error(argText);
    alert(argText);
    debug.log[debug.log.length] = debug.time() + ' x ' + argText;
};
// ログを表示
debug.print = function() {
    var resultLog = '<ul>';
    for(var i = debug.log.length - 1; i >= 0; i--){  
        resultLog += '<li>' + debug.log[i] + '</li>';
    }
    return resultLog += '</ul>';
};


// データベースのオブジェクト
// 一部参考：http://starzero.hatenablog.com/entry/20100714/1279121559
var webdb = {};
webdb.db = null;

//データベースオープン
webdb.open = function() {
    debug.add('DB OPEN');
    webdb.db = window.openDatabase(CONST.DB_NAME, CONST.DB_VERSION, CONST.DB_DISPLAY, CONST.DB_SIZE);
};

//テーブル作成，レコード挿入・更新・削除
webdb.setSql = function(argSql) {
    return new Promise(function(resolve,reject){
        webdb.db.transaction(function(tx) {
            tx.executeSql(argSql, [], function(tx,rs){resolve(rs)}, function(tx,er){reject(er)});
        });
    });
};

//テーブル創成
webdb.create = function() {
    return webdb.setSql('CREATE TABLE IF NOT EXISTS Tb_Message (userId, displayName, messageText, messageDate, newFlag)');
};

//テーブル削除
webdb.drop = function() {
    return webdb.setSql('DROP TABLE IF EXISTS Tb_Message');
};

//レコード取得
webdb.getSql = function(argSql) {
    return new Promise(function(resolve,reject){
        webdb.db.readTransaction(function(tx){
            tx.executeSql(argSql, [], function(tx,rs){resolve(rs)}, function(tx,er){reject(er)});
        });
    });
};


//テーブルがなかったら作成
webdb.open();
webdb.create()
    .then(function(resultResolve){
        //成功時
        debug.add('たぶんテーブルできた。');
    })
    .catch(function(resultReject){
        //失敗時
        debug.adde('テーブル作成失敗？：' + resultReject);
    });


//Onsen UIの読み込みが完了したときの処理
ons.ready(function() {
    debug.add('Onsen UI is ready!');
});


//ひな形に入っていたメニューからページを切り替える処理
window.fn = {};
window.fn.open = function() {
  var menu = document.getElementById('menu');
  menu.open();
};
window.fn.load = function(page) {
  var content = document.getElementById('content');
  var menu = document.getElementById('menu');
  content
    .load(page)
    .then(menu.close.bind(menu));
};
window.fn.menu = function (boolean) {
    var menu = document.getElementById('menu');
    if (boolean=='true') {
        menu.setAttribute('swipeable','');
    }else{
        menu.removeAttribute('swipeable');
    }
};

var ncmb = new NCMB(CONST.NCMB_APP, CONST.NCMB_CLI);

//端末の準備ができた時のイベント
document.addEventListener("deviceready", function(){
            // デバイストークンを取得してinstallationに登録する
            window.NCMB.monaca.setDeviceToken(
                CONST.NCMB_APP,
                CONST.NCMB_CLI,
                CONST.NCMB_PAS  
            );
},false);

//ページが表示された際のイベント
document.addEventListener('show',function(event){
    debug.add('show:' + event.target.id);
    
    switch (event.target.id.toString()) {
        case 'login':
            //スワイプメニューを無効化する。
            window.fn.menu('false');
            //ローカルストレージに値がある場合は画面にセットし、ない場合は新規登録に飛ばす。
            if (localStorage.getItem(CONST.LS_LUID) == null){
                //強制的に飛ばしてたけど再セットアップ時邪魔なことが判明したのでとりあえずやめる。
                //（普通にログインしたくてもさせてもらえなくなってしまう）
                //window.fn.load('addnew.html');
            }else{
                $('#login_user_id').val(localStorage.getItem(CONST.LS_LUID));
                $('#login_display_name').val(localStorage.getItem(CONST.LS_NAME));
            }
            break;

        case 'home':
            //Homeが表示された際、最新の情報を取得して表示する。
            niftyGetMessagePutDb();
            break;

        case 'setting':
            //Settingが表示された際、持ってる情報を設定する。
            $('#setting_user_id').text(localStorage.getItem(CONST.LS_LUID));
            $('#setting_display_name').text(localStorage.getItem(CONST.LS_NAME) + convertIdToTrip(localStorage.getItem(CONST.LS_LUID)));
            $('#setting_last_update').text(localStorage.getItem(CONST.LS_LUPD));
            break;

        case 'about':
            //今のところログを降順で表示する。
            $('#about_log').html(debug.print());
            break;
    }
});


//ログインが押下されたときの処理
function checkLoginInput(){
    debug.add('checkLogin Start');

    //入力された文字
    debug.add($('#login_user_id').val());
    debug.add($('#login_display_name').val());

    //Niftyへログイン
    ncmb.User.login($('#login_user_id').val(), CONST.NCMB_PAS)
        .then(function(user) {
            debug.add('ログイン成功');
            localStorage.setItem(CONST.LS_LUID, $('#login_user_id').val());
            localStorage.setItem(CONST.LS_NAME, $('#login_display_name').val());
            window.fn.load('home.html');
            window.fn.menu('true');
        })
        .catch(function(error) {
            debug.adde('ログイン失敗：' + error);
        });
}

//登録が押下されたときの処理
function checkAddnewInput(){
    debug.add('checkAddnew Start');

    //入力された文字
    debug.add($('#addnew_user_id').val());
    debug.add($('#addnew_display_name').val());

    //Niftyへ新規登録
    var user = new ncmb.User();
    user.set('userName', $('#addnew_user_id').val())
        .set('password', CONST.NCMB_PAS);
    // 任意フィールドに値を追加 
    user.signUpByAccount()
        .then(function(user) {
            //成功時はローカルストレージに退避してhome画面へ遷移
            debug.add('新規登録に成功');
            initializeLocalDB()
            localStorage.setItem(CONST.LS_LUID, $('#addnew_user_id').val());
            localStorage.setItem(CONST.LS_NAME, $('#addnew_display_name').val());
            localStorage.setItem(CONST.LS_LUPD, getDate(-90));
            window.fn.load('home.html');
            window.fn.menu('true');
        })
        .catch(function(error) {
            //失敗時はメッセージと理由を表示
            debug.adde('新規登録失敗：' + error);
        });
}

//発言ボタンを押したときの処理
function reloadMessageArea(){

    //発言の登録→NewFlagのクリア→発言の取得→最終更新日の更新→画面の描写の順で処理していく。
    niftyRegisterMessage($('#input-message').val());

}

//発言をNiftyに登録する。
function niftyRegisterMessage(argMessage){
    //引数がない場合はそのまま終了する。
    if (argMessage == '') {
        debug.add('1.発言は無かったです。');
        resetNewFlag();
    }else{
        //改行をbrに変換してから登録する。
        argMessage = argMessage.replace(/[\n\r]/g,'<br>');

        //MessageRepositoryへの接続。
        var dataStore = ncmb.DataStore(CONST.MR_STORE);
        var messageRepository = new dataStore();

        //発言を登録する。
        messageRepository
            .set(CONST.MR_ID, localStorage.getItem(CONST.LS_LUID))
            .set(CONST.MR_NAME, localStorage.getItem(CONST.LS_NAME))
            .set(CONST.MR_TEXT, argMessage)
            .set(CONST.MR_DATE, getDate())
            .save()
            .then(function(messageRepository){
                // 保存後の処理
                debug.add('1.発言を保存しました。');
                $('#input-message').val('');
                resetNewFlag();
            }).catch(function(error){
                // エラー処理
                debug.adde('1.発言の保存に失敗しました。：' + error);
                resetNewFlag();
            });
        //プッシュ通知する。
        var push = new ncmb.Push();
        push.set("immediateDeliveryFlag", true)
            .set("message", argMessage.value)
            .set("target", ["android"])
            .set("title", "NTTk静岡Aチーム");
        push.send()
            .then(function(push){
            // 送信後処理
        })
        .catch(function(err){
           // エラー処理
        　debug.adde('9.Push通信に失敗しました。：' + error);
         });        

    }
}

//新規発言フラグのクリア
function resetNewFlag(){
    webdb.setSql('UPDATE Tb_Message SET newFlag = "0"')
        .then(function(){
            debug.add('2.フラグをクリアしました。');
            niftyGetMessagePutDb();
        })
        .catch(function(){
            debug.adde('2.フラグがクリアできませんでした。：' + error);
            niftyGetMessagePutDb();
        });
    
}

//Niftyに登録されている発言をローカルDBに格納する。
function niftyGetMessagePutDb(){
    //MessageRepositoryへの接続。
    var dataStore = ncmb.DataStore(CONST.MR_STORE);
    dataStore
        .greaterThan(CONST.MR_DATE, localStorage.getItem(CONST.LS_LUPD))
        .order(CONST.MR_DATE)
        .fetchAll()
        .then(function(results){
            for (var i = 0; i < results.length; i++) {
                //ローカルのDBに格納する。
                var values = '"' + results[i].get(CONST.MR_ID) + '","' + results[i].get(CONST.MR_NAME) + '","' + results[i].get(CONST.MR_TEXT) + '","' + results[i].get(CONST.MR_DATE) + '","1"';
                webdb.setSql('INSERT INTO Tb_Message (userId, displayName, messageText, messageDate, newFlag) VALUES (' + values + ')');
            }
            debug.add('3.発言を格納しました。');
            updateLastUpdate();
        })
        .catch(function(error){
            debug.adde('3.発言の格納に失敗しました。：' + error);
            updateLastUpdate();
        });
}

//最終更新日を更新する。
function updateLastUpdate(){
    //最終更新日を更新する。
    try {
        localStorage.setItem(CONST.LS_LUPD, getDate());
        debug.add('4.最終更新日を更新しました。');
        drawMessageArea();
    } catch(error) {
        debug.adde('4.最終更新日の更新に失敗しました。');
        drawMessageArea();
    }
}


//取得したメッセージを描写
function drawMessageArea(){
    //デバッグ用
    webdb.getSql('Select userId, displayName, messageText, messageDate, newFlag From Tb_Message Order By messageDate')
        .then(function(resultResolve){
            //成功時
            $('#main-message').html(getMessageHtml(resultResolve));
            $('#final-anker').focus();
            debug.add('5.発言を描写しました。');
        }).catch(function(tx, resultReject){
            //失敗時
            $('#main-message').text('テーブル読み込み失敗？　' + resultReject);
            debug.adde('5.発言の描写に失敗しました。：' + error);
        });
}

//取得したレコードをHTMLに変換する。
function getMessageHtml(argRecord){
    var rusultHtml = '';

    //レコードがあるとき、HTMLの形で編集する。
    if(argRecord.rows.length > 0){  
        for(var i = 0; i < argRecord.rows.length; i++){  
            var row = argRecord.rows.item(i);  
            if(row.userId == localStorage.getItem(CONST.LS_LUID)){
                rusultHtml += '<div class="r-message">';
            }else{
                rusultHtml += '<div class="l-message">';
            }
            rusultHtml += '  <div class="message-name">' + row.displayName + convertIdToTrip(row.userId) + '</div>';
            rusultHtml += '  <div class="message-text">' + row.messageText + '</div>';
            rusultHtml += '  <div class="message-date">';
            if(row.newFlag == '1'){
                rusultHtml += '<span style="color:#FF0000;">New!</span> ';
            }
            rusultHtml += row.messageDate + '</div></div>';
        }
    }
    return rusultHtml;
}


//日時の文字列を取得する。
function getDate(argAddDay){
    //引数がない場合はゼロをセット
    if (argAddDay == null) argAddDay = 0;
    
    var now = new Date;
    now.setDate(now.getDate() + argAddDay);
    var resultDate = 'YYYY/MM/DD hh:mm:ss';
    resultDate = resultDate.replace(/YYYY/g, now.getFullYear());
    resultDate = resultDate.replace(/MM/g, ('0' + (now.getMonth() + 1)).slice(-2));
    resultDate = resultDate.replace(/DD/g, ('0' + now.getDate()).slice(-2));
    resultDate = resultDate.replace(/hh/g, ('0' + now.getHours()).slice(-2));
    resultDate = resultDate.replace(/mm/g, ('0' + now.getMinutes()).slice(-2));
    resultDate = resultDate.replace(/ss/g, ('0' + now.getSeconds()).slice(-2));

    return resultDate;
}

//トリップ作成
function convertIdToTrip(argUserId){
    var tempCharCode1 = 0;
    var tempCharCode2 = 0;
    var resultTrip = '';
    for (var i = 0; i < (argUserId.length - (argUserId.length % 2)); i += 2){
        tempCharCode1 = argUserId.charCodeAt(i) + argUserId.charCodeAt(i+1);
        tempCharCode1 = tempCharCode1 % 75;
        tempCharCode1 = tempCharCode1 + 48;
        resultTrip += String.fromCharCode(tempCharCode1);

        tempCharCode2 = Math.abs(argUserId.charCodeAt(i) - argUserId.charCodeAt(i+1));
        tempCharCode2 = tempCharCode2 + 48;
        resultTrip += String.fromCharCode(tempCharCode2);
    }
//    resultTrip = ' [' + resultTrip.replace(/[^0-9a-zA-Z]/,'') + ']';
    resultTrip = ' [' + resultTrip.replace(/[\W]/,'').replace('<','').replace('>','') + ']';
    return resultTrip;
}

//データベースをさっくりクリアする。
function initializeLocalDB() {
    webdb.drop()
        .then(webdb.create())
        .then(function(resultResolve){
            debug.add('たぶんテーブルできた。');
            localStorage.setItem(CONST.LS_LUPD, getDate(-90));
        })
        .catch(function(resultReject){
            debug.adde('テーブル再創生失敗？：' + resultReject);
    });
}
