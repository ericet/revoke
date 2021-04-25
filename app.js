steem.api.setOptions({ url: 'https://api.steem.buzz' });
const revokeList = ['steemcn.app', 'peakmonsters.app', 'buildteam', 'busy.app', 'dclick.app', 'dpoll.xyz', 'esteem-app', 'partiko-steemcon', 'steemauto', 'tasteem.app', 'nextcolony', 'share2steem', 'steemhunt.com', 'steemstem-app', 'fundition.app', 'trailbase', 'typeearn', 'smartsteem', 'steemknights'];

$(document).ready(async function () {
    $('#username').on('input', async function () {
        document.getElementById('search').disabled = true;
        let steemId = $('#username').val();
        console.log(steemId)
        $('div#authorized_app').html('');
        let account = await getAccount([steemId]);
        getAuthorizedListHtlm(account);
    });
    $('#revoke').submit(async function (e) {
        e.preventDefault();

        let authorizedList = [];
        let revokeList = [];
        let hasKeychain = false;
        let activeKey = $('#active_key').val().trim();
        let steemId = $('#username').val();
        let account = await getAccount([steemId]);
        if (window.steem_keychain) {
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

        updateAccountOperation(account, authorizedList, revokeList, hasKeychain, activeKey)
    });

});
async function getAuthorizedListHtlm(account) {
    if (account !== undefined) {
        let authorizedList = await getAuthorizedList(account.posting.account_auths);
        let htmlString = `<table class="table is-bordered">
        <thead>
          <tr class="th is-selected">
            <th scope="col" style="text-align:center">App</th>
            <th scope="col" style="text-align:center">Revoke</th>
          </tr>
        </thead>
        <tbody>
        `;
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
function updateAccountOperation(account, newAuthorizedList, revokeList, hasKeychain, activeKey) {
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
    sendOperations(operations, activeKey, revokeList, hasKeychain);
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

function getAccount(accounts) {
    return new Promise((resolve, reject) => {
        steem.api.getAccounts(accounts, function (err, result) {
            if (!err) {
                resolve(result[0]);
            } else {
                reject(err);
            }
        });
    });
}


function sendOperations(operations, active_key, revokeList, hasKeychain) {
    let steemId = $('#username').val();
    if (hasKeychain && active_key === '') {
        steem_keychain.requestBroadcast(steemId, operations, "Active", async function (response) {
            if (response.success) {
                $('div#notification').html(`<div class="alert alert-info alert-dismissible fade show" role="alert">
            You've revoked <strong>${revokeList}</strong>
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>`);
                let account = await getAccount([steemId]);
                getAuthorizedListHtlm(account);
            } else {
                $('div#notification').html(`<div class="alert alert-danger alert-dismissible fade show" role="alert">
                ${err.message}
                <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>`);
            }
        });

    } else {
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
                    let steemId = $('#username').val();
                    let account = await getAccount([steemId]);
                    getAuthorizedListHtlm(account);
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
