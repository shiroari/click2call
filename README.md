# Click2Call
Click to call button implementation based on [sipML5](http://sipml5.org) library

# Browser supports
sipML5 needs WebSockets and WebRTC support. Project works fine with FireFox and Chrome. The Problems most related to WebRTC. You can check current situation with WebRTC [here](http://caniuse.com/#search=webrtc).

# Files

* **sipml5.js.** Custom sipml5 library build with some fixes and digest support.
* **click2call.js.** Sipml5 API wrapper that provides easy-to-use interface for click2call button implementation.
* **click2call-button.js.** Sample click2call button implementation with jquery.

# Demo

You should be inside of a Naumen LAN.

[http://shiroari.github.io/click2call/](http://shiroari.github.io/click2call/)

# API

Библиотека click2call.js добавляет в браузер глобальный объект `c2c` c методом `newUserAgent` создающим объект `UserAgent`. В качестве параметра метод принимает настройки необходимые для осуществления звонка.

* **from.** Номер или имя пользователя, от имени которого производится вызов.
* **to.** Номер, на который совершается вызов.
* **params.** Объект содержащий параметры вызова и значения. Может быть передана функция, которая возвращает вычисленный объект. Вычисление функции происходит в момент совершения вызова (Опциональный).
* **domain.** Адрес SIP сервера.
* **password.** Пароль пользователя. Может быть опущен, если используется digest или разрешены звонки без регистрации (Опциональный).
* **digest.** Дайджест пользователя, полученный согласно спецификации RFC 2069. Может быть опущен, если используется password или разрешены звонки без регистрации (Опциональный).
* **sipProxy.**  Адрес OverSIP сервера.
* **stunServers.** Список STUN серверов (Опциональный).

Объект `UserAgent` позволяет осуществлять вызовы и управление ими. Для этого объект содержит методы:

* **init.** Инициализация библиотеки sipml5 в браузере.
* **start.** Запуск sipml5 и соединение с sip-proxy.
* **register.** Регистрация на SIP сервере.
* **callto.** Совешение вызова. Если метод вызван без аргументов звонок осуществляется на номер, указанный в параметра `to`.
* **drop.** Завершение текущего вызова.

Для отследивания состояния могут использоваться флаги, а также подписка на изменение состояния.

* **connecting.** Флаг определяет происходит ли в данный момент инициализация звонка.
* **connected.** Флаг определяет существует ли в данный момент активный вызов.
* **statusText.** Текстовое описание состояния `UserAgent`.
* **onChange.** Метод позволяет зарегистрировать метод, который будет вызываться при каждом изменении состояния `UserAgent`.

Библиотека click2call-button.js добавляет в объект `c2c` дополнительный метод `newButton`, который позволяет создавать простейшую кнопку звонка и выводить состояние звонка в строку статуса. В качестве параметра метод принимает целевые элементы страницы и настройки необходимые для осуществления звонка.

* **button.** Кнопка для осуществления звонка.
* **status.** Элемент для вывода состояния и результата звонка.
* **userAgentSettings.** Параметры аналогичные аргументам для метода `newUserAgent`.
