"use client";

import BackButton from "@/components/BackButton";
import Navbar from "@/components/Navbar";
import { useState } from "react";

const conversations = [
  { id: 1, name: "Jordan M.", item: "Mountain Bike", preview: "Is the bike still available?", time: "2m ago", unread: 2, avatar: "J" },
  { id: 2, name: "Taylor R.", item: "Mini Fridge", preview: "I can offer my desk lamp for it", time: "1h ago", unread: 0, avatar: "T" },
  { id: 3, name: "Alex C.", item: "Bio Textbooks", preview: "Can I pick it up tomorrow?", time: "3h ago", unread: 1, avatar: "A" },
  { id: 4, name: "Sam L.", item: "TI-84 Calculator", preview: "Thanks for the quick response!", time: "Yesterday", unread: 0, avatar: "S" },
];

const messages = [
  { id: 1, from: "Jordan M.", text: "Hey! Is the mountain bike still available?", time: "10:02 AM", mine: false },
  { id: 2, from: "You", text: "Yes it is! Still looking for a buyer.", time: "10:04 AM", mine: true },
  { id: 3, from: "Jordan M.", text: "Great. Is the price negotiable? I was thinking closer to $40.", time: "10:06 AM", mine: false },
  { id: 4, from: "You", text: "I could do $45, it's in decent shape aside from the chain rust.", time: "10:08 AM", mine: true },
  { id: 5, from: "Jordan M.", text: "That works. Can we meet at West Village tomorrow around noon?", time: "10:09 AM", mine: false },
];

export default function MessagesPage() {
  const [selectedConv, setSelectedConv] = useState(conversations[0].id);

  const activeConv = conversations.find((c) => c.id === selectedConv) || conversations[0];
  const activeMessages = selectedConv === 1 ? messages : [
    { id: 1, from: activeConv.name, text: `Hi — this is a placeholder chat for ${activeConv.name}.`, time: "Now", mine: false },
  ];

  return (
    <div className="min-h-screen bg-[#f9faf2]">
      <Navbar />
      <div className="max-w-[1280px] mx-auto px-6 py-8 flex flex-col gap-4" style={{ height: "calc(100vh - 73px)" }}>
        <BackButton fallbackHref="/marketplace" label="Back to Marketplace" />
        <div className="min-h-0 flex-1 bg-white border border-[#e2e3db] rounded-2xl shadow-[0px_4px_20px_0px_rgba(27,67,50,0.06)] overflow-hidden flex">
          {/* Sidebar */}
          <div className="w-80 border-r border-[#e2e3db] flex flex-col shrink-0">
            <div className="p-5 border-b border-[#e2e3db]">
              <h2 className="font-semibold text-[#1a1c18] text-xl mb-3">Messages</h2>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5.5" stroke="#717973" strokeWidth="1.2"/><path d="M12 12l-1.5-1.5" stroke="#717973" strokeWidth="1.2" strokeLinecap="round"/></svg>
                <input className="w-full bg-[#f3f4ec] border border-[#e2e3db] rounded-full pl-9 pr-4 py-2 text-sm text-[#414844] outline-none" placeholder="Search messages..." />
              </div>
            </div>
            <div className="overflow-y-auto flex-1">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConv(conv.id)}
                  className={`p-4 border-b border-[#e2e3db] flex items-start gap-3 cursor-pointer hover:bg-[#f9faf2] transition-colors ${selectedConv === conv.id ? "bg-[#f3f4ec]" : ""}`}
                >
                  <div className="w-10 h-10 rounded-full bg-[#1b4332] flex items-center justify-center text-white text-sm font-semibold shrink-0">
                    {conv.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-semibold text-[#1a1c18] text-sm">{conv.name}</span>
                      <span className="text-[#717973] text-xs">{conv.time}</span>
                    </div>
                    <p className="text-[#414844] text-xs mb-0.5 truncate">{conv.item}</p>
                    <p className="text-[#717973] text-xs truncate">{conv.preview}</p>
                  </div>
                  {conv.unread > 0 && (
                    <div className="w-5 h-5 rounded-full bg-[#1b4332] flex items-center justify-center text-white text-[10px] font-bold shrink-0">{conv.unread}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="p-5 border-b border-[#e2e3db] flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1b4332] flex items-center justify-center text-white text-sm font-semibold">{activeConv.avatar}</div>
              <div>
                <p className="font-semibold text-[#1a1c18] text-base">{activeConv.name}</p>
                <p className="text-[#717973] text-xs">Re: {activeConv.item}</p>
              </div>
              <div className="ml-auto flex gap-2">
                <button className="border border-[#e2e3db] text-[#1a1c18] text-xs font-semibold tracking-[0.6px] px-4 py-2 rounded-lg hover:bg-[#f3f4ec] transition-colors">View Listing</button>
                <button className="bg-[#1b4332] text-white text-xs font-semibold tracking-[0.6px] px-4 py-2 rounded-lg hover:bg-[#012d1d] transition-colors">Make Offer</button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
              {activeMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[60%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.mine ? "bg-[#1b4332] text-white rounded-br-sm" : "bg-[#f3f4ec] text-[#1a1c18] rounded-bl-sm"}`}>
                    <p>{msg.text}</p>
                    <p className={`text-[10px] mt-1 ${msg.mine ? "text-white/60" : "text-[#717973]"}`}>{msg.time}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-[#e2e3db] flex items-center gap-3">
              <input className="flex-1 bg-[#f3f4ec] border border-[#e2e3db] rounded-full px-5 py-3 text-sm text-[#414844] outline-none" placeholder="Type a message..." />
              <button className="bg-[#1b4332] text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#012d1d] transition-colors shrink-0">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8h12M10 4l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
