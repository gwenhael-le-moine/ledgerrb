require "http/server"

require "./lib/ledger"

server = HTTP::Server.new(8091) do |context|
  context.response.content_type = "text/plain"
  context.response.print Ledger#version # "Hello world, got #{context.request.path}!"
end

puts "Listening on http://127.0.0.1:8091"
server.listen
