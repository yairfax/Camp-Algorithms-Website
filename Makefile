all:
	[ -f ./sessions ] || mkdir sessions
	[ -f ./sessions/sessions.json ] || (touch ./sessions/sessions.json && printf "{\n\t\"sessions\": [\n\t]\n}" >> sessions/sessions.json)
	npm install