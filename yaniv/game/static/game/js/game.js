print_chat('The game starts when everybody is ready.');
const user_name = JSON.parse(document.getElementById('user_name').textContent);
const room_name = JSON.parse(document.getElementById('room_name').textContent);
// var nb_users = {{ current_user.player.room.nb_users }}
var players = [];
var my_index;
var nb_users;
var cards_order;
var scores;
var started = false;
const my_gap = 90;  // gap between cards in pixels (width of a card = 78)
const others_gap = 10;
const discard_gap = 60;
const stack_left_shift = 90;
var who_starts;
var whose_turn;
var my_turn = false;
var my_turn_before = false;
var card_slap_down;
const speed = 200;
const hand_size = 5;
const radius = 0.6;
const min_yaniv = 7;
const asaf_cost = 30;
const cut_level = 50;
const losing_score = 200;

const wsGameAdress = 'ws://'
                  + window.location.host
                  + '/ws/game/'
                  + room_name
                  + '/';
const gameSocket = new WebSocket(wsGameAdress);
gameSocket.onopen = function(e) {
    gameSocket.send(JSON.stringify({
        'connect_msg': user_name
    }));
};

function Connector(wsurl) {
    this.socket = new WebSocket(wsurl);
}
Connector.prototype.emit = function(type, msg) {
    var self = this;
    (function _waitForSocketConnection(callback) {
        setTimeout(function() {
            if (self.socket.readyState === 1) {
                // console.log("Connection is made")
                if (callback != null) {
                    callback();
                }
                return;
            } else {
                // console.log("wait for connection...")
                _waitForSocketConnection(callback);
            }
        }, 5);
    })(function() {
        // console.log("message sent!!!");
        var obj = {};
        obj[type] = msg;
        self.socket.send(JSON.stringify(obj));
    });
}
var con = new Connector(wsGameAdress);






// create Deck
var deck;
var $container;



// XX TEMPORARY, JUST FOR TESTING PURPOSES
// players = ["Player 1", "Player 2", "Player 3"]
// nb_users = players.length;
// my_index = 0;
// my_turn = true;
// who_starts = my_index;
// cards_order = [...Array(54).keys()];
// shuffle(cards_order);
// start_round();



function start_round() {
    deck = Deck(true);
    $container = document.getElementById('container');
    deck.mount($container);
    sort_deck(cards_order);

    deck.cards.forEach(function (card) {
        card.rot = 0;
        card.setSide('back');
        card.disableClicking();
        card.selected = false;
        card.just_drawn = false;
    });
    deck.stack = [];
    for (var i = deck.cards.length-1; i >= 0; i--) {
        var card = deck.cards[i];
        card.location = -1;
        deck.stack.push(card);
    }
    deck.discard = [];
    deck.hands = [];
    for (const i of Array(nb_users).keys()) {
        deck.hands[i] = [];
    }
    deck.angular_positions = [];
    deck.rots = [];
    player_ind = my_index;
    var count_players = 1;
    var angle = 3 * Math.PI / 2;
    while (count_players <= nb_users) {
        deck.angular_positions[player_ind] = angle;
        deck.rots[player_ind] = 180 * (1.5 - angle / Math.PI);
        angle -= 2 * Math.PI / nb_users;
        if (player_ind == nb_users - 1) {
            player_ind = 0;
        } else {
            player_ind++;
        }
        count_players++;
    }
    place_names();

    var count = 1;
    for (const i of Array(hand_size).keys()) {
        for (const j of Array(nb_users).keys()) {
            var deck_ind = deck.cards.length - count;
            var card = deck.cards[deck_ind];
            deck.stack.shift();
            card.location = j
            deck.hands[j].push(card);
            count++;
        }
    }

    for (const j of Array(nb_users).keys()) {
        bubble_sort_cards(deck.hands[j]);
    }


    count = 1
    for (const i of Array(hand_size).keys()) {
        for (const j of Array(nb_users).keys()) {
            var deck_ind = deck.cards.length - count;
            var card = deck.cards[deck_ind];
            var hand = deck.hands[j]
            var hand_ind = hand.indexOf(card);

            var gap = j == my_index ? my_gap : others_gap;
            var gap_x = gap * Math.sin((90 - deck.rots[j]) * Math.PI / 180) * (hand_ind - 2);
            var gap_y = gap * Math.cos((90 - deck.rots[j]) * Math.PI / 180) * (hand_ind - 2);
            var x = gap_x + ((1 + radius * Math.cos(deck.angular_positions[j])) * window.innerWidth - window.innerWidth) / 2;
            var y = gap_y + ((1 - radius * Math.sin(deck.angular_positions[j])) * window.innerHeight - window.innerHeight) / 2;
            var z = hand_ind;
            var rot = deck.rots[j];
            var change_side = j == my_index ? true : false;
            if (j == my_index) {
            // if (j == my_index && my_turn) {
                card.enableClicking();
            }
            card.animateTo({
                delay: 1000 + count * speed, // wait 1 second + count * 2 ms
                duration: speed,
                ease: 'quartOut',
                x: x,
                y: y,
                z_end: z,
                rot: rot,
                change_side: change_side
            });
            count++;
        }
    }

    // First card in the discard stack
    var deck_ind = deck.cards.length - count;
    var card = deck.cards[deck_ind];
    deck.stack.shift();
    deck.discard.push(card);
    card.location = -2;
    if (my_turn) card.enableClicking();
    var x = 0.5 * window.innerWidth - window.innerWidth / 2;
    var y = 0.5 * window.innerHeight - window.innerHeight / 2;
    card.animateTo({
        delay: 1000 + count * speed, // wait 1 second + count * 2 ms
        duration: speed,
        ease: 'quartOut',
        x: x,
        y: y,
        z_end: 0,
        change_side: true,
    });

    // First card in the main stack
    count++;
    var deck_ind = deck.cards.length - count;
    var card = deck.cards[deck_ind];
    if (my_turn) card.enableClicking();


    // deck.stack[0].setSide('front');
}





function sort_deck(cards_order){
    sorted_cards = [];
    for (const ind of Array(deck.cards.length).keys()) {
        var card = deck.cards[cards_order[ind]];
        card.i = ind;
        sorted_cards.push(card);
    }
    deck.cards = sorted_cards;

    for (const ind of Array(deck.cards.length).keys()) {
        var card = deck.cards[ind];
        // card.i = ind;
        var x = (- stack_left_shift) - ind / 4;
        var y = -ind / 4;
        var z = ind;
        card.animateTo({
          delay: z * 2,
          duration: 200,
          x: plusminus(Math.random() * 40 + 20) * fontSize() / 16,
          y: y,
        });
        card.animateTo({
            delay: 200 + z * 2,
            duration: 200,
            x: x,
            y: y,
            z_start: z,
        });
    }
}


function is_combination_correct(){
    var correct = false;
    var straight = false;
    var selected_cards = get_selected_cards(get_ind=false)
    if (deck.hands[my_index].length == 0) {
        correct = true;
        card_slap_down = {
          'type': null
        };
    } else if (selected_cards.length == 1) {
        correct = true;
        var card = selected_cards[0];
        if (card.suit == 4) {
            card_slap_down = {
              'type': 'joker'
            };
        } else {
            card_slap_down = {
              'type': 'series',
              'rank': card.rank
            };
        }
    }
    else if (selected_cards.length > 1 && is_series(selected_cards)) {
        correct = true;
    } else if (selected_cards.length > 2 && is_straight(selected_cards)) {
        correct = true;
        straight = true;
        card_slap_down = {
          'type': 'straight'
        };
        // XX COMMENT FAIRE PAR EXMPLE SI JOKER 5 6 ??  OU ALORS 5 6 JOKER ?????
    }
    return [correct, straight];
}


function is_series(cards){
    var same_rank = true;
    var rank;
    cards.forEach(function (card) {
        if (card.suit != 4) {
            if (rank === undefined) {
                rank = card.rank;
            } else {
                if (card.rank != rank) {
                    same_rank = false;
                }
            }
        }
    });
    if (same_rank) {
        if (rank === undefined) {
            card_slap_down = {
              'type': 'joker'
            };
        } else {
            card_slap_down = {
              'type': 'series',
              'rank': rank
            };
        }
    }
    return same_rank;
}



function is_straight(cards){
    var straight = true;
    var same_suit = is_same_suit(cards);
    if (same_suit) {
        cards = bubble_sort_cards(cards);

        var nb_jokers = 0;
        var previous_rank;
        var ind = 0;
        while (ind < cards.length) {
            var card = cards[ind];
            if (card.suit == 4) {
                nb_jokers++;
                ind++;
            } else if (previous_rank === undefined) {
                previous_rank = card.rank;
                ind++;
            } else if (card.rank == previous_rank + 1) {
                previous_rank++;
                ind++;
            } else if (nb_jokers > 0) {
                nb_jokers--;
                previous_rank++;
            } else {
                straight = false;
                break;
            }
        }
        // return true;
    } else {
        straight = false;
    }
    return straight;
}



function is_same_suit(cards){
    var same_suit = true;
    var suit;
    cards.forEach(function (card) {
        if (card.suit != 4) {
            if (suit === undefined) {
                suit = card.suit;
            } else {
                if (card.suit != suit) {
                    same_suit = false;
                }
            }
        }
    });
    return same_suit;
}


function get_selected_cards(get_ind){
    var selected_cards = [];
    var hand = deck.hands[my_index];
    hand.forEach(function (card, ind) {
        if (card.selected) {
            if (get_ind) {
                selected_cards.push(ind);
            } else {
                selected_cards.push(card);
            }

        }
    });
    return selected_cards;
}


function is_slap_down_correct(click_suit, click_rank){
    var correct = false;
    var selected_cards = get_selected_cards(get_ind=false)
    if (selected_cards.length == 1) {
        var card = selected_cards[0];
        if (card.just_drawn) {
            if (card_slap_down["type"] == "joker" && card.suit == 4) {
                correct = true;
            } else if (card_slap_down["type"] == "series" && card_slap_down["rank"] == card.rank) {
                correct = true;
            }
            // STRAIGHT ??!!!
        }
    }
    return correct;
}


function disable_all_clicking(){
    var hand = deck.hands[my_index];
    hand.forEach(function(card) {
        card.disableClicking();
    });
    var card = deck.stack[0];
    card.disableClicking();
    deck.discard.forEach(function(card) {
        card.disableClicking();
    });
}


function card_up_down(card, is_up){
    var dy = is_up ? -30 : 30;
    var y = card.y + dy
    card.animateTo({
        delay: 0,
        duration: 100,
        ease: 'quartOut',
        y: y,
    });
}


function bubble_sort_cards(cards){
    var len = cards.length;
    for (var i = len-1; i>=0; i--) {
        for (var j = 1; j<=i; j++) {
            if (is_card_sup(cards[j-1], cards[j])) {
                var temp = cards[j-1];
                cards[j-1] = cards[j];
                cards[j] = temp;
            }
        }
    }
    return cards;
}



function is_card_sup(card_1, card_2){
    if (card_1.suit == 4) {
        if (card_2.suit == 4) {
            return card_1.rank > card_2.rank;
        } else {
            return false;
        }
    } else {
        if (card_2.suit == 4) {
            return true;
        } else {
            if (card_1.rank == card_2.rank) {
                return card_1.suit > card_2.suit;
            } else {
                return card_1.rank > card_2.rank;
            }
        }
    }
}


function shuffle(a) {
  var j, x, i;
  for (i = a.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      x = a[i];
      a[i] = a[j];
      a[j] = x;
  }
  return a;
}


function fontSize() {
  return window.getComputedStyle(document.body).getPropertyValue('font-size').slice(0, -2);
}


function plusminus(value) {
  var plusminus = Math.round(Math.random()) ? -1 : 1;
  return plusminus * value;
}



// Rank : from 1 to 13 (10 + face cards)
// Suits :
// 0 : spades
// 1 : hearts
// 2 : clubs
// 3 : diamonds
// 4 : jokers (which also have a rank)




gameSocket.onmessage = function(e) {
    const data = JSON.parse(e.data);
    if (data.hasOwnProperty('chat_msg')) {
        print_chat(data.chat_msg.user_name + ': ' + data.chat_msg.msg);
    } else if (data.hasOwnProperty('connect_msg')) {
        players = data.connect_msg.users_list;
        nb_users = players.length;
        $("#game-scores").empty();
        players.forEach(function(player) {
            $("#game-scores").append('<li>' + player + ': ' + 0 + '</li>');
        });
        print_chat(data.connect_msg.new_user_name + ' has joined the room.');
    } else if (data.hasOwnProperty('ready_msg')) {
        print_chat('Go!');
        document.querySelector('#game-ready-submit').disabled = true;
        document.querySelector('#game-yaniv-submit').disabled = false;
        started = true;
        players = data.ready_msg.users_order;
        nb_users = players.length;
        my_index = players.indexOf(user_name);
        my_turn = my_index == 0 ? true : false;
        who_starts = 0;
        whose_turn = 0;
        scores = Array.apply(null, new Array(nb_users)).map(Number.prototype.valueOf,0);
        cards_order = data.ready_msg.cards_order;
        start_round();
    } else if (data.hasOwnProperty('card_msg')) {
        var d = data.card_msg;
        update_game(d);
    } else if (data.hasOwnProperty('slap_down_msg')) {
        var d = data.slap_down_msg;
        update_slap_down(d);
    } else if (data.hasOwnProperty('yaniv_msg')) {
        const yaniv_name = players[data.yaniv_msg.user_ind];
        print_chat(yaniv_name + ': ' + 'Yaniv !');
        var end = update_scores(data.yaniv_msg.user_ind);
        $("#game-scores").empty();
        players.forEach(function(player, ind) {
            $("#game-scores").append('<li>' + player + ': ' + scores[ind] + '</li>');
        });
        deck.unmount();
        if (end) {
            print_chat(get_winner() + ' has won!');
        } else {
            cards_order = data.yaniv_msg.cards_order;
            update_my_turn_start()
            start_round();
        }
    } else if (data.hasOwnProperty('disconnect_msg')) {
        var left_name = data.disconnect_msg.user_name;
        if (players.indexOf(left_name) > -1) {
            if (started) {
                deck.unmount();
                print_chat(data.disconnect_msg.user_name + ' has left the room.');
                if (nb_users == 2) {
                    print_chat('The game has ended.');
                } else {
                    nb_users--;
                    var left_index = players.indexOf(left_name);
                    players.splice(left_index, 1);
                    scores.splice(left_index, 1);
                    deck.hands.splice(left_index, 1);
                    deck.angular_positions.splice(left_index, 1);
                    deck.rots.splice(left_index, 1);
                    $("#game-scores").empty();
                    players.forEach(function(player) {
                        $("#game-scores").append('<li>' + player + ': ' + 0 + '</li>');
                    });
                    update_my_turn_left(left_index)
                    element = document.getElementById(left_name);
                    if (element != null) {
                        element.parentNode.removeChild(element);
                    }
                    cards_order = data.disconnect_msg.cards_order;
                    start_round();
                }
            } else {
                var left_index = players.indexOf(left_name);
                players.splice(left_index, 1);
                nb_users--;
                $("#game-scores").empty();
                players.forEach(function(player) {
                    $("#game-scores").append('<li>' + player + ': ' + 0 + '</li>');
                });
            }
        }
    } else {
      // pass
    }
};






function place_names() {
    for (const i of Array(nb_users).keys()) {
        element = document.getElementById(players[i]);
        if (element != null) {
            element.parentNode.removeChild(element);
        }
        var g = document.createElement("p");
        g.setAttribute("id", players[i]);
        var t = document.createTextNode(players[i]);
        g.appendChild(t);
        g.style.position = "absolute";
        var x = ((2 + radius * 1.4 * Math.cos(deck.angular_positions[i])) * window.innerWidth - window.innerWidth) / 2;
        var y = ((2 - radius * 1.4 * Math.sin(deck.angular_positions[i])) * window.innerHeight - window.innerHeight) / 2;
        g.style.left = x+'px';
        g.style.top = y+'px';
        if (i == whose_turn) {
            g.style.color = 'blue';
        }
        document.body.appendChild(g);
    }
};






function update_my_turn_start() {
    if (who_starts == nb_users - 1) {
        who_starts = 0;
    } else {
        who_starts++;
    }
    whose_turn = who_starts;
    my_turn_before = false;
    my_turn = my_index == whose_turn ? true : false;
};

function update_my_turn(user_ind) {
    if (user_ind == nb_users - 1) {
        whose_turn = 0;
    } else {
        whose_turn = user_ind + 1;
    }
    my_turn_before = my_turn ? true : false;
    my_turn = my_index == whose_turn ? true : false;
};

function update_my_turn_left(left_index) {
    if (who_starts == left_index && who_starts == nb_users - 1) {
        who_starts = 0;
    } else if (who_starts > left_index) {
        who_starts--;
    }
    whose_turn = who_starts;
    my_index = players.indexOf(user_name);
    my_turn_before = false;
    my_turn = my_index == whose_turn ? true : false;
};


function update_game(d) {
    update_my_turn(d.user_ind)
    place_names();

    // Remove just_drawn
    deck.hands[d.user_ind].forEach(function (card) {
        card.just_drawn = false;
    });

    // Give card to player
    var card;
    if (d.taken_card == -1) {
        card = deck.stack[0];
        card.just_drawn = true;
        deck.stack.shift();

    } else {
        card = deck.discard[d.taken_card];
        deck.discard.splice(d.taken_card, 1);
    }
    card.location = d.user_ind;
    deck.hands[d.user_ind].push(card);
    var next_card = deck.stack[0];
    if (my_turn) next_card.enableClicking();

    // Empty the discard
    deck.discard.forEach(function (card, ind) {
        card.location = -1;
        // card.setSide('back');
        deck.stack.push(card);
    });
    deck.discard = [];

    // Update the stack
    deck.stack.slice().reverse().forEach(function (card, ind) {
        if (card.side == 'front') {
            card.setSide('back');
        }
        var x = (- stack_left_shift)-ind / 4;
        var y = -ind / 4;
        var z = ind;
        card.animateTo({
            delay: 200 + ind * 2,
            duration: 200,
            x: x,
            y: y,
            rot: 0,
            z_start: z,
        });
    });

    // Place selected cards in the discard and sort and enable clicking if my turn and not a middle card if straight
    d.selected_cards_ind.forEach(function (ind) {
        var card = deck.hands[d.user_ind][ind];
        card.selected = false;
        card.location = -2;
        deck.discard.push(card);
    });
    // for (const i of Array(d.selected_cards_ind.length).keys()) {
    for (var i = d.selected_cards_ind.length - 1; i >= 0; i--) {
        deck.hands[d.user_ind].splice(d.selected_cards_ind[i], 1);
    }
    discard_sort_and_clicking(d.is_straight, false);
    deck.discard.forEach(function (card, ind) {
        var x = ind * discard_gap + 0.5 * window.innerWidth - window.innerWidth / 2;
        var y = 0.5 * window.innerHeight - window.innerHeight / 2;
        var change_side = d.user_ind == my_index ? false : true;
        card.animateTo({
            delay: 200 + ind * speed * 1.5, // wait 1 second + count * 2 ms
            duration: speed * 1.5,
            ease: 'quartOut',
            x: x,
            y: y,
            rot: 0,
            z_end: ind,
            change_side: change_side,
        });
    });

    // Place the new card in the hand and sort and ENABLECLICKING if myturn
    bubble_sort_cards(deck.hands[d.user_ind]);
    // Randomize position of oppenents' cards
    var randomized_hand = [...Array(deck.hands[d.user_ind].length).keys()];
    if (my_index != d.user_ind) {
        shuffle(randomized_hand);
    }
    deck.hands[d.user_ind].forEach(function (card, hand_ind) {
        var gap = d.user_ind == my_index ? my_gap : others_gap;
        var gap_x = gap * Math.sin((90 - deck.rots[d.user_ind]) * Math.PI / 180) * (randomized_hand[hand_ind] - 2);
        var gap_y = gap * Math.cos((90 - deck.rots[d.user_ind]) * Math.PI / 180) * (randomized_hand[hand_ind] - 2);
        var x = gap_x + ((1 + radius * Math.cos(deck.angular_positions[d.user_ind])) * window.innerWidth - window.innerWidth) / 2;
        var y = gap_y + ((1 - radius * Math.sin(deck.angular_positions[d.user_ind])) * window.innerHeight - window.innerHeight) / 2;
        var z = randomized_hand[hand_ind];
        var rot = deck.rots[d.user_ind];
        var change_side;
        if (d.user_ind == my_index) {
            if (card.side == 'back') {
                change_side = true;
            }
        } else {
            if (card.side == 'front') {
                change_side = true;
            }
        }
        card.animateTo({
            delay: 200 + hand_ind * speed * 1.5, // wait 1 second + count * 2 ms
            duration: speed * 1.5,
            ease: 'quartOut',
            x: x,
            y: y,
            z_end: z,
            rot: rot,
            change_side: change_side
        });
    });

    // Enable clicking for the current player
    // if (my_turn) {
    deck.hands[my_index].forEach(function (card) {
        card.enableClicking();
    });
    // }
};




function discard_sort_and_clicking(is_straight, is_slap_down) {
    if (is_straight) {
        var nb_jokers = 0;
        deck.discard.forEach(function (card) {
            if (card.suit == 4) {
                nb_jokers++;
            }
        });
        var is_sorted = false;
        const max_iter = 10;   // XX Arbitrary value here just to prevent infinite loop (should be less, the exact number depends on the number of jokers)
        var count = 0;
        while (!is_sorted && count < max_iter) {
            var previous_rank = null;
            for (const ind of Array(deck.discard.length).keys()) {
                var card = deck.discard[ind];
                if (card.suit == 4) {
                    if (previous_rank !== null) {
                        previous_rank++;
                    }
                } else if (previous_rank === null) {
                    previous_rank = card.rank;
                } else if (card.rank == previous_rank + 1) {
                    previous_rank++;
                    if (ind == deck.discard.length - 1) {
                        is_sorted = true;
                    }
                } else {
                    array_move(deck.discard, 0, ind - 1)  // Put the first card (a joker) at this position
                    break;
                }
            }
            count++;
        }
        //Enable clicking only in the extreme
        if (my_turn || (my_turn_before && !is_slap_down)) {
            deck.discard[0].enableClicking();
            deck.discard[deck.discard.length - 1].enableClicking();
        }
    } else {
        if (my_turn || (my_turn_before && !is_slap_down)) {
            deck.discard.forEach(function (card) {
                card.enableClicking();
            });
        }
    }
};






function update_slap_down(d) {
    // Remove just_drawn and change clickable
    // Remove card from hand, put it in discard
    // Sort hand
    // Sort discard
    var ind = d.selected_cards_ind[0];
    var card = deck.hands[d.user_ind][ind];
    // card.just_drawn = false;
    card.selected = false;
    card.location = -2;
    deck.discard.push(card);
    for (var i = d.selected_cards_ind.length - 1; i >= 0; i--) {
        deck.hands[d.user_ind].splice(d.selected_cards_ind[i], 1);
    }
    discard_sort_and_clicking(false, true);
    deck.discard.forEach(function (card, ind) {
        var x = ind * discard_gap + 0.5 * window.innerWidth - window.innerWidth / 2;
        var y = 0.5 * window.innerHeight - window.innerHeight / 2;
        // var change_side = d.user_ind == my_index ? false : true;
        var change_side = false;
        if (d.user_ind != my_index && card.just_drawn) {
            change_side = true;
            card.just_drawn = false;
        }
        card.animateTo({
            delay: 200 + ind * speed * 1.5, // wait 1 second + count * 2 ms
            duration: speed * 1.5,
            ease: 'quartOut',
            x: x,
            y: y,
            rot: 0,
            z_end: ind,
            change_side: change_side,
        });
    });

    // Place the new card in the hand and sort and ENABLECLICKING if myturn
    bubble_sort_cards(deck.hands[d.user_ind]);
    // Randomize position of oppenents' cards
    var randomized_hand = [...Array(deck.hands[d.user_ind].length).keys()];
    if (my_index != d.user_ind) {
        shuffle(randomized_hand);
    }
    deck.hands[d.user_ind].forEach(function (card, hand_ind) {
        var gap = d.user_ind == my_index ? my_gap : others_gap;
        var gap_x = gap * Math.sin((90 - deck.rots[d.user_ind]) * Math.PI / 180) * (randomized_hand[hand_ind] - 2);
        var gap_y = gap * Math.cos((90 - deck.rots[d.user_ind]) * Math.PI / 180) * (randomized_hand[hand_ind] - 2);
        var x = gap_x + ((1 + radius * Math.cos(deck.angular_positions[d.user_ind])) * window.innerWidth - window.innerWidth) / 2;
        var y = gap_y + ((1 - radius * Math.sin(deck.angular_positions[d.user_ind])) * window.innerHeight - window.innerHeight) / 2;
        var z = randomized_hand[hand_ind];
        var rot = deck.rots[d.user_ind];
        var change_side;
        if (d.user_ind == my_index) {
            if (card.side == 'back') {
                change_side = true;
            }
        } else {
            if (card.side == 'front') {
                change_side = true;
            }
        }
        card.animateTo({
            delay: 200 + hand_ind * speed * 1.5, // wait 1 second + count * 2 ms
            duration: speed * 1.5,
            ease: 'quartOut',
            x: x,
            y: y,
            z_end: z,
            rot: rot,
            change_side: change_side
        });
    });

    // Enable clicking for the current player
    // if (my_turn) {
    deck.hands[my_index].forEach(function (card) {
        card.enableClicking();
    });
    // }
};





function array_move(arr, old_index, new_index) {
    if (new_index >= arr.length) {
        var k = new_index - arr.length + 1;
        while (k--) {
            arr.push(undefined);
        }
    }
    arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
};





function update_scores(yaniv_usr_ind) {
    var hand_values = [];
    for (const i of Array(nb_users).keys()) {
        hand_values[i] = hand_total(i);
    }
    const yaniv_value = hand_values[yaniv_usr_ind];
    hand_values[yaniv_usr_ind] = 0;
    var asaf = false;
    for (const i of Array(nb_users).keys()) {
        if (i != yaniv_usr_ind && hand_values[i] <= yaniv_value) {
            asaf = true;
            print_chat(players[i] + ': ' + 'Contre-Yaniv !');
        }
    }
    if (asaf) {
        hand_values[yaniv_usr_ind] = asaf_cost + yaniv_value;
    }

    for (const i of Array(nb_users).keys()) {
        scores[i] += hand_values[i];
        if (scores[i] % cut_level == 0 && hand_values[i] > 0) {
            scores[i] -= 50;
        }
    }

    var end = false;
    for (const i of Array(nb_users).keys()) {
        if (scores[i] > losing_score) {
            end = true;
        }
    }
    return end;
};


function hand_total(hand_ind) {
    var tot = 0;
    deck.hands[hand_ind].forEach(function (card) {
        if (card.suit != 4) {
            tot += value_card(card.rank);
        }
    });
    return tot;
};

function value_card(rank) {
    if (rank < 10) {
        return rank;
    } else {
        return 10;
    }
};


function get_winner() {
    // XX GERER LES EGALITES
    var winner;
    var min_score = 1000;
    for (const i of Array(nb_users).keys()) {
        if (scores[i] < min_score) {
            min_score = scores[i];
            winner = players[i];
        }
    }
    return winner;
};



function print_chat(str) {
    var textarea = document.querySelector('#game-log');
    textarea.value += (str + '\n');
    textarea.scrollTop = textarea.scrollHeight;
}





gameSocket.onclose = function(e) {
    console.error('Game socket closed unexpectedly');
};

document.querySelector('#game-ready-submit').onclick = function(e) {
    const checkedInputDom = document.querySelector('#game-ready-submit');
    const checked = checkedInputDom.checked;
    if (checked) {
        gameSocket.send(JSON.stringify({
            "ready_msg": user_name
        }));
    } else {
        gameSocket.send(JSON.stringify({
            "not_ready_msg": user_name
        }));
    }
};

document.querySelector('#game-yaniv-submit').onclick = function(e) {
    if (my_turn && hand_total(my_index) <= min_yaniv) {
        gameSocket.send(JSON.stringify({
            'yaniv_msg': my_index
        }));
    }
};

document.querySelector('#game-message-input').focus();
document.querySelector('#game-message-input').onkeyup = function(e) {
    if (e.keyCode === 13) {  // enter, return
        document.querySelector('#game-message-submit').click();
    }
};

document.querySelector('#game-message-submit').onclick = function(e) {
    const messageInputDom = document.querySelector('#game-message-input');
    // const message = messageInputDom.value;
    const message = {
        'user_name': user_name,
        'msg': messageInputDom.value
    };
    gameSocket.send(JSON.stringify({
        'chat_msg': message
    }));
    messageInputDom.value = '';
};

window.onbeforeunload = function(){
    return true;
}

$(window).bind("pageshow", function(event) {
    if (event.originalEvent.persisted) {
        window.location.reload();
    }
});
