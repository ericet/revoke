steem.api.setOptions({ url: 'https://api.steem.buzz' });
hive.api.setOptions({url:'https://anyx.io'})
const steemRevokeList = ['bravocoin','buzzi.app','steemcn.app','crowdini.app','steemplay.app', 'steemerapp','holybread.app','engrave.app','deegram','peakmonsters.app', 'buildteam', 'busy.app', 'dclick.app', 'dpoll.xyz', 'esteem-app', 'partiko-steemcon', 'steemauto', 'tasteem.app', 'nextcolony', 'share2steem', 'steemhunt.com', 'steemstem-app', 'fundition.app', 'trailbase', 'typeearn', 'smartsteem', 'steemknights', "dlive.app", "dreply", "ntopaz-artisteem", "steem-recipe"];
const hiveRevokeList = ['cn-trail', 'busy.app', 'partiko-steemcon', 'steem2hive', 'steemcn.app', 'dclick.app', 'dlive.app', 'dpoll.xyz', 'dreply', 'fundition.app', 'ntopaz-artisteem', 'steem-recipe', 'steemhunt.com', 'steempeak.app', 'tasteem.app', 'typeearn', 'ulogs.app', 'wherein-io', 'drugwars.app', 'esteem-app', 'letseat.app', 'steemgg.app','steem-drivers','steemerapp','crowdini.app','deegram','dlike.app','steeditor.app','steemplay.app'];;
let previousChain = "STEEM";

$(document).ready(async function () {
    $('#chain').on('click', async function (e) {
        e.preventDefault();
        let chain = document.getElementById('chain').value;
        let username = $('#username').val();
        if (previousChain !== chain && username !== '') {
            console.log(chain)
            let account = await getAccount([username], chain);
            getAuthorizedListHtlm(account, chain);
        }
        previousChain = chain;
    })
    $('#username').on('input', async function () {
        document.getElementById('search').disabled = true;
        let chain = document.getElementById('chain').value;
        let username = $('#username').val();
        $('div#authorized_app').html('');
        let account = await getAccount([username], chain);
        getAuthorizedListHtlm(account, chain);
    });
    $('#revoke').submit(async function (e) {
        e.preventDefault();
        let authorizedList = [];
        let revokeList = [];
        let hasKeychain = false;
        let activeKey = $('#active_key').val().trim();
        let username = $('#username').val();
        let chain = document.getElementById('chain').value;
        let account = await getAccount([username], chain);
        if (chain === 'STEEM' && window.steem_keychain) {
            hasKeychain = true;
        } else if (chain === 'HIVE' && window.hive_keychain) {
            hasKeychain = true;
        }
        if (activeKey == '' && !hasKeychain) {
            alert('Your Private Active Key is missing.');
            $("#active_key").focus();
            return;
        }
        $('div#notification').html(`<div class="loader"></div>`)
        $.each($("input:checkbox[name='type']:not(:checked)"), function () {
            authorizedList.push([$(this).val(), 1]);
        });
        $.each($("input:checkbox[name='type']:checked"), function () {
            revokeList.push($(this).val());
        });

        updateAccountOperation(account, authorizedList, revokeList, hasKeychain, activeKey, chain)
    });

});
async function getAuthorizedListHtlm(account, chain) {
    if (account !== undefined) {
        let authorizedList = await getAuthorizedList(account.posting.account_auths);
        let htmlString = `<table class="table is-bordered">
        <thead>
          <tr class="th is-selected">
            <th scope="col" style="text-align:center">${chain} App</th>
            <th scope="col" style="text-align:center">Revoke</th>
          </tr>
        </thead>
        <tbody>
        `;
        let revokeList=[];
        if(chain==='STEEM'){
            revokeList = steemRevokeList;
        }else if(chain === 'HIVE'){
            revokeList = hiveRevokeList;
        }
        for (let app of authorizedList) {
            if (revokeList.includes(app[0])) {
                htmlString += `<tr><td style="text-align:center"> <label class="form-check-label is-3" for="${app[0]}">${app[0]}</label></td>
                <td style="text-align:center"><div class="form-check">
                <input name="type" type="checkbox" class="big-checkbox" value="${app[0]}" id="${app[0]}" checked>
              </div></td></tr>`;

            } else {
                htmlString += `<tr><td style="text-align:center"> <label class="form-check-label is-3" for="${app[0]}">${app[0]}</label></td>
                <td style="text-align:center"><div class="form-check">
                <input name="type" type="checkbox" class="big-checkbox" value="${app[0]}" id="${app[0]}">
              </div></td></tr>`;
            }
        }
        htmlString += `</tbody></table>`;

        if (!authorizedList.length) {
            $('div#authorized_app').html(`<div>Not authorized apps found!</div>`);
        } else {
            $('div#authorized_app').html(htmlString);
            document.getElementById('search').disabled = false;
        }
    }
}
function updateAccountOperation(account, newAuthorizedList, revokeList, hasKeychain, activeKey, chain) {
    let operations = [];
    let op = [
        'account_update', {
            account: account.name,
            posting: {
                weight_threshold: account.posting.weight_threshold,
                account_auths: newAuthorizedList,
                key_auths: account.posting.key_auths
            },
            memo_key: account.memo_key,
            json_metadata: account.json_metadata
        }
    ]
    operations.push(op);
    sendOperations(operations, activeKey, revokeList, hasKeychain, chain);
}

function getAuthorizedList(account_auths) {
    return new Promise((resolve, reject) => {
        let authorizedList = [];
        for (let app of account_auths) {
            authorizedList.push(app);
        }
        resolve(authorizedList);

    });
}

function getAccount(accounts, chain) {
    return new Promise((resolve, reject) => {
        if (chain == 'STEEM') {
            steem.api.getAccounts(accounts, function (err, result) {
                if (!err) {
                    resolve(result[0]);
                } else {
                    reject(err);
                }
            });
        } else if (chain == 'HIVE') {
            hive.api.getAccounts(accounts, function (err, result) {
                if (!err) {
                    resolve(result[0]);
                } else {
                    reject(err);
                }
            });
        }
    });
}


function sendOperations(operations, active_key, revokeList, hasKeychain, chain) {
    let username = $('#username').val();
    if (hasKeychain && active_key === '' && chain === 'STEEM') {
        steem_keychain.requestBroadcast(username, operations, "Active", async function (response) {
            if (response.success) {
                $('div#notification').html(`<div class="alert alert-info alert-dismissible fade show" role="alert">
            You've revoked <strong>${revokeList}</strong>
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>`);
                let account = await getAccount([username], chain);
                getAuthorizedListHtlm(account, chain);
            } else {
                $('div#notification').html(`<div class="alert alert-danger alert-dismissible fade show" role="alert">
                ${err.message}
                <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>`);
            }
        });

    }
    else if (hasKeychain && active_key === '' && chain === 'HIVE') {
        hive_keychain.requestBroadcast(username, operations, "Active", async function (response) {
            if (response.success) {
                $('div#notification').html(`<div class="alert alert-info alert-dismissible fade show" role="alert">
            You've revoked <strong>${revokeList}</strong>
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>`);
                let account = await getAccount([username], chain);
                getAuthorizedListHtlm(account, chain);
            } else {
                $('div#notification').html(`<div class="alert alert-danger alert-dismissible fade show" role="alert">
                ${err.message}
                <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>`);
            }
        });

    }
    else if (active_key !== '' && chain === 'STEEM') {
        steem.broadcast.send(
            { operations: operations, extensions: [] },
            { active: active_key },
            async function (err, result) {
                if (result && !err) {
                    $('div#notification').html(`<div class="alert alert-info alert-dismissible fade show" role="alert">
                You've revoked <strong>${revokeList}</strong>
                <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>`);
                    let username = $('#username').val();
                    let account = await getAccount([username], chain);
                    getAuthorizedListHtlm(account, chain);
                } else {
                    $('div#notification').html(`<div class="alert alert-danger alert-dismissible fade show" role="alert">
                ${err.message}
                <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>`);
                }
            });
    }
    else if (active_key !== '' && chain === 'HIVE') {
        hive.broadcast.send(
            { operations: operations, extensions: [] },
            { active: active_key },
            async function (err, result) {
                if (result && !err) {
                    $('div#notification').html(`<div class="alert alert-info alert-dismissible fade show" role="alert">
                You've revoked <strong>${revokeList}</strong>
                <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>`);
                    let username = $('#username').val();
                    let account = await getAccount([username], chain);
                    getAuthorizedListHtlm(account, chain);
                } else {
                    $('div#notification').html(`<div class="alert alert-danger alert-dismissible fade show" role="alert">
                ${err.message}
                <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>`);
                }
            });
    }
}
