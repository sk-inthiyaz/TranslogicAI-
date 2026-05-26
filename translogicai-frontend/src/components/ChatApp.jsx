import React, { useState, useRef, useEffect } from "react";
import MessageBubble, { TypingIndicator } from "./MessageBubble";
import { geocodePlace } from "../utils/geocodePlace";
import API_BASE from "../config/api";

const now = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const STEPS = { IDLE: "IDLE", AWAITING_IMAGE: "AWAITING_IMAGE", AWAITING_IMAGE_CONFIRM: "AWAITING_IMAGE_CONFIRM", NEGOTIATING: "NEGOTIATING", ACCEPTED: "ACCEPTED" };

// ── Local fallback price calculator (mirrors backend logic) ──────────────────
function computePriceLocally(distanceKm, weightKg, urgency) {
  const dist = parseFloat(distanceKm) || 0;
  const kg   = parseFloat(weightKg)   || 0;
  // Rate per km based on weight tier
  let ratePerKm;
  if (kg <= 500) ratePerKm = 15;
  else if (kg <= 3000) ratePerKm = 25;
  else if (kg <= 7000) ratePerKm = 35;
  else if (kg <= 15000) ratePerKm = 46;
  else ratePerKm = 62;
  let price = ratePerKm * dist;
  // Urgency multiplier
  const factor = { Low: 1.0, Medium: 1.15, High: 1.3 };
  price *= factor[urgency] || 1.15;
  return Math.max(500, Math.round(price));
}

const GREETINGS = [
  "Hi there! 👋 I'm Logix, your TransLogic AI assistant. I'm here to make your shipping experience smooth and stress-free.\n\nTo get started, could you share your pickup location, drop location, weight of goods, and how urgently you need them delivered?",
  "Hello! 😊 I'm Logix from TransLogic AI. Let's get your shipment sorted quickly!\n\nPlease fill in your pickup, destination, weight, and urgency — I'll find you the best deal.",
];

// ── AI Response Helper — calls Gemini via backend ────────────────────────────
async function getAIResponse(situation, context, history, fallback) {
  try {
    const res = await fetch(`${API_BASE}/api/chat/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ situation, context, history, fallback }),
    });
    const data = await res.json();
    return data.reply || fallback;
  } catch {
    return fallback;
  }
}

function ChatApp({ onRouteUpdate }) {
  const [messages, setMessages] = useState([]);
  const [step, setStep] = useState(STEPS.IDLE);
  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");
  const [weight, setWeight] = useState("");
  const [urgency, setUrgency] = useState("Medium");
  const [isTyping, setIsTyping] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState(null);
  const [negotiationOffer, setNegotiationOffer] = useState("");
  const [negotiationAttempts, setNegotiationAttempts] = useState(0);
  const [finalPrice, setFinalPrice] = useState(null);
  const [detectedLabel, setDetectedLabel] = useState(null);
  const [confirmInput, setConfirmInput] = useState("");
  const [currentUrgency, setCurrentUrgency] = useState("Medium");
  const [bookingState, setBookingState] = useState("idle"); // idle | booking | booked | error
  const [bookedLoadId, setBookedLoadId] = useState(null);
  // Store current booking details for the Book button
  const [lastPickup, setLastPickup] = useState("");
  const [lastDrop, setLastDrop] = useState("");
  const [lastWeight, setLastWeight] = useState("");
  const [lastUrgency, setLastUrgency] = useState("Medium");
  const [lastPickupLat, setLastPickupLat] = useState(null);
  const [lastPickupLng, setLastPickupLng] = useState(null);
  const [lastDistanceKm, setLastDistanceKm] = useState(0);
  // eslint-disable-next-line no-unused-vars
  const [driverAccepted, setDriverAccepted] = useState(false); // true once driver accepts
  const [weatherSurge, setWeatherSurge] = useState(false); // true if rain/storm surge pricing
  const [lastCounterOffer, setLastCounterOffer] = useState(null); // tracks the latest counter-offer during negotiation
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const pollTimerRef = useRef(null);

  // ── Persist ALL chat state to localStorage ──────────────────────────────────
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("chatMessages") || "[]");
      const savedStep = localStorage.getItem("chatStep") || STEPS.IDLE;
      const savedLoadId = localStorage.getItem("bookedLoadId") || null;
      const savedPrice = localStorage.getItem("finalPrice");
      const savedBookingState = localStorage.getItem("bookingState") || "idle";
      const savedCalcPrice = localStorage.getItem("calculatedPrice");
      const savedWeatherSurge = localStorage.getItem("weatherSurge");
      const savedUrgency = localStorage.getItem("currentUrgency");

      // Restore booking details
      const savedLastPickup = localStorage.getItem("chatLastPickup") || "";
      const savedLastDrop = localStorage.getItem("chatLastDrop") || "";
      const savedLastWeight = localStorage.getItem("chatLastWeight") || "";
      const savedLastUrgency = localStorage.getItem("chatLastUrgency") || "Medium";
      const savedLastPickupLat = localStorage.getItem("chatLastPickupLat");
      const savedLastPickupLng = localStorage.getItem("chatLastPickupLng");
      const savedLastDistanceKm = localStorage.getItem("chatLastDistanceKm");
      const savedNegotiationAttempts = localStorage.getItem("chatNegotiationAttempts");
      const savedLastCounterOffer = localStorage.getItem("chatLastCounterOffer");

      if (saved.length > 0) {
        setMessages(saved);
        setStep(savedStep);
        if (savedLoadId) {
          setBookedLoadId(savedLoadId);
          setBookingState(savedBookingState);
        }
        if (savedPrice) setFinalPrice(Number(savedPrice));
        if (savedCalcPrice) setCalculatedPrice(Number(savedCalcPrice));
        if (savedWeatherSurge === "true") setWeatherSurge(true);
        if (savedUrgency) setCurrentUrgency(savedUrgency);

        // Restore booking details for Book button
        if (savedLastPickup) setLastPickup(savedLastPickup);
        if (savedLastDrop) setLastDrop(savedLastDrop);
        if (savedLastWeight) setLastWeight(savedLastWeight);
        if (savedLastUrgency) setLastUrgency(savedLastUrgency);
        if (savedLastPickupLat) setLastPickupLat(Number(savedLastPickupLat));
        if (savedLastPickupLng) setLastPickupLng(Number(savedLastPickupLng));
        if (savedLastDistanceKm) setLastDistanceKm(Number(savedLastDistanceKm));
        if (savedNegotiationAttempts) setNegotiationAttempts(Number(savedNegotiationAttempts));
        if (savedLastCounterOffer) setLastCounterOffer(Number(savedLastCounterOffer));

        // If we're in the middle of a conversation, show a "welcome back" message
        const alreadyWelcomed = sessionStorage.getItem("chatWelcomedBack");
        if (savedStep !== STEPS.IDLE && !alreadyWelcomed) {
          sessionStorage.setItem("chatWelcomedBack", "true");
          const stepLabels = {
            [STEPS.AWAITING_IMAGE]: "upload an image of your goods (or skip it)",
            [STEPS.AWAITING_IMAGE_CONFIRM]: "confirm the detected goods",
            [STEPS.AWAITING_PRICE_ACTION]: "decide on the quoted price",
            [STEPS.NEGOTIATING]: "continue our price negotiation",
            [STEPS.ACCEPTED]: "confirm and book your truck",
            [STEPS.BOOKED]: "your booking is being processed",
          };
          const whatNext = stepLabels[savedStep] || "continue where we left off";
          setTimeout(async () => {
            const welcomeBack = await getAIResponse(
              `The customer just returned to the chat after navigating away. They were in the middle of booking from ${savedLastPickup} to ${savedLastDrop}. Next step: ${whatNext}. Welcome them back warmly and briefly remind them where they left off. Keep it short and friendly — 1-2 sentences max. Don't repeat pickup/drop details. Just say something like "Welcome back! We were about to..." in a human way.`,
              null, saved,
              `Welcome back! 👋 We were just about to ${whatNext}. Let's pick up where we left off!`
            );
            setMessages(prev => [...prev, { text: welcomeBack, sender: "bot", time: now() }]);
          }, 400);
        }
      } else {
        // Fresh start — greet via AI
        const fallbackGreeting = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
        setTimeout(async () => {
          const aiGreeting = await getAIResponse(
            "A new customer just opened the chat for the first time. Greet them warmly as Logix and ask for their pickup location, drop location, weight of goods, and urgency level. Make it feel like a friendly human greeting.",
            null,
            [],
            fallbackGreeting
          );
          addBot(aiGreeting, 300);
        }, 200);
      }

      // Restore map data from localStorage
      try {
        const savedMapData = JSON.parse(localStorage.getItem("chatMapData") || "null");
        if (savedMapData && onRouteUpdate) {
          onRouteUpdate(savedMapData);
        }
      } catch { /* ignore */ }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save messages
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("chatMessages", JSON.stringify(messages));
    }
  }, [messages]);

  // Save step
  useEffect(() => {
    localStorage.setItem("chatStep", step);
  }, [step]);

  // Save booking details whenever they change
  useEffect(() => { if (lastPickup) localStorage.setItem("chatLastPickup", lastPickup); }, [lastPickup]);
  useEffect(() => { if (lastDrop) localStorage.setItem("chatLastDrop", lastDrop); }, [lastDrop]);
  useEffect(() => { if (lastWeight) localStorage.setItem("chatLastWeight", lastWeight); }, [lastWeight]);
  useEffect(() => { localStorage.setItem("chatLastUrgency", lastUrgency); }, [lastUrgency]);
  useEffect(() => { if (lastPickupLat != null) localStorage.setItem("chatLastPickupLat", String(lastPickupLat)); }, [lastPickupLat]);
  useEffect(() => { if (lastPickupLng != null) localStorage.setItem("chatLastPickupLng", String(lastPickupLng)); }, [lastPickupLng]);
  useEffect(() => { if (lastDistanceKm) localStorage.setItem("chatLastDistanceKm", String(lastDistanceKm)); }, [lastDistanceKm]);
  useEffect(() => { localStorage.setItem("chatNegotiationAttempts", String(negotiationAttempts)); }, [negotiationAttempts]);
  useEffect(() => { if (lastCounterOffer != null) localStorage.setItem("chatLastCounterOffer", String(lastCounterOffer)); }, [lastCounterOffer]);
  useEffect(() => { if (finalPrice != null) localStorage.setItem("finalPrice", String(finalPrice)); }, [finalPrice]);
  useEffect(() => { localStorage.setItem("bookingState", bookingState); }, [bookingState]);
  useEffect(() => { if (bookedLoadId) localStorage.setItem("bookedLoadId", bookedLoadId); }, [bookedLoadId]);

  const addBot = (text, delay = 900) =>
    new Promise(resolve => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, { text, sender: "bot", time: now() }]);
        resolve();
      }, delay);
    });

  const addUser = (text) =>
    setMessages(prev => [...prev, { text, sender: "user", time: now() }]);

  // NOTE: Duplicate greeting useEffect removed — greeting is handled in the localStorage useEffect above

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!pickup.trim() || !drop.trim() || !weight) {
      const missingMsg = await getAIResponse(
        "The customer tried to submit a booking but left some fields empty. Gently remind them to fill in pickup location, drop location, and weight.",
        null, messages,
        "Oops! 😅 Looks like some details are missing. Please fill in pickup location, drop location, and weight to continue."
      );
      await addBot(missingMsg, 400);
      return;
    }

    const savedPickup = pickup, savedDrop = drop, savedWeight = weight, savedUrgency = urgency;
    addUser(`📦 From: ${pickup} → ${drop} | Weight: ${weight}kg | Urgency: ${urgency}`);
    setPickup(""); setDrop(""); setWeight(""); setUrgency("Medium");

    setIsTyping(true);
    try {
      const [start, end] = await Promise.all([geocodePlace(savedPickup), geocodePlace(savedDrop)]);
      // Haversine only used as fallback — we prefer backend road distance
      const R = 6371;
      const dLat = ((end.lat - start.lat) * Math.PI) / 180;
      const dLon = ((end.lng - start.lng) * Math.PI) / 180;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos((start.lat * Math.PI) / 180) * Math.cos((end.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
      const haversineKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      let customerName = "Guest", customerPhone = "0000000000";
      const cd = JSON.parse(localStorage.getItem("customerData") || "null");
      if (cd) { customerName = cd.fullName || cd.name || "Guest"; customerPhone = cd.phone || "0000000000"; }

      const res = await fetch(`${API_BASE}/api/logistics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pickup: savedPickup, drop: savedDrop, weight: parseFloat(savedWeight), urgency: savedUrgency, distanceKm: haversineKm, cargo: "General Goods", customerName, customerPhone }),
      });
      const data = await res.json();
      setIsTyping(false);

      // Use the backend's ROAD distance (same as map), not Haversine
      const roadDistanceKm = data.distanceKm || haversineKm;

      // Use backend price if available, otherwise compute locally as fallback
      const resolvedPrice = (data.price && !isNaN(data.price))
        ? data.price
        : computePriceLocally(roadDistanceKm, savedWeight, savedUrgency);

      // Check if weather has rain/storm surge
      const weatherStr = (data.weather || "").toLowerCase();
      const hasSurge = weatherStr.includes("rain") || weatherStr.includes("storm") || weatherStr.includes("thunder");
      setWeatherSurge(hasSurge);
      localStorage.setItem("weatherSurge", String(hasSurge));

      setCalculatedPrice(resolvedPrice);
      localStorage.setItem("calculatedPrice", String(resolvedPrice));
      setCurrentUrgency(savedUrgency);
      localStorage.setItem("currentUrgency", savedUrgency);
      // Save booking details for later use by Book button
      setLastPickup(savedPickup); setLastDrop(savedDrop);
      setLastWeight(savedWeight); setLastUrgency(savedUrgency);
      setLastPickupLat(data.pickupLat || null);
      setLastPickupLng(data.pickupLng || null);
      setLastDistanceKm(roadDistanceKm);
      setBookingState("idle"); setBookedLoadId(null);
      setLastCounterOffer(null);

      if (start && end) {
        const mapPayload = {
          start: { ...start, name: savedPickup },
          end: { ...end, name: savedDrop },
          weight: parseFloat(savedWeight),
          routeData: data.routeData,
          summary: { price: resolvedPrice, carbon: data.carbon || (roadDistanceKm * 0.21).toFixed(2), eta: data.eta, vehicle: data.vehicle },
        };
        onRouteUpdate(mapPayload);
        // Persist map data so it survives page navigation
        localStorage.setItem("chatMapData", JSON.stringify(mapPayload));
      }

      const routeMsg = await getAIResponse(
        `The customer submitted shipment details and we successfully plotted the route. Tell them the route is ready. IMPORTANT: The exact distance is ${roadDistanceKm.toFixed(0)} km — use this exact number, do NOT calculate your own. Ask them to upload a photo of their goods so we can assign the right vehicle. If they prefer, they can skip the image upload.`,
        { pickup: savedPickup, drop: savedDrop, weight: savedWeight, urgency: savedUrgency, distance: roadDistanceKm.toFixed(0) },
        messages,
        `Great! I've plotted your route from ${savedPickup} to ${savedDrop}. Distance is roughly ${roadDistanceKm.toFixed(0)} km and I've got a price estimate ready for you. Before I confirm the quote, could you upload a photo of your goods? This helps us assign the right vehicle for safe delivery. 📸`
      );
      await addBot(routeMsg, 800);
      setStep(STEPS.AWAITING_IMAGE);
    } catch (err) {
      setIsTyping(false);
      const errorMsg = await getAIResponse(
        "Something went wrong while processing the customer's shipment request — probably a network issue. Apologize briefly and ask them to try again.",
        null, messages,
        "Hmm, something went wrong on my end. 😔 Please check your network and try again in a moment."
      );
      await addBot(errorMsg, 400);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    addUser("📷 Image uploaded");
    setIsTyping(true);
    setStep(STEPS.IDLE);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`${API_BASE}/api/detect-objects`, { method: "POST", body: formData });
      const result = await response.json();
      let label = null, maxConf = 0;
      if (result.objectsResult?.values) {
        result.objectsResult.values.forEach(obj =>
          obj.tags?.forEach(tag => { if (tag.confidence > maxConf) { maxConf = tag.confidence; label = tag.name; } })
        );
      }
      setDetectedLabel(label);
      setIsTyping(false);
      if (label) {
        const detectedMsg = await getAIResponse(
          "The customer uploaded an image and our system detected the goods. Tell them what was detected and ask them to confirm by typing yes or no.",
          { detectedLabel: label }, messages,
          `Thanks for the photo! 📸 I can see what looks like ${label} in the image. Is that correct? Just type yes or no and we'll move on.`
        );
        await addBot(detectedMsg, 700);
      } else {
        const noDetectMsg = await getAIResponse(
          "The customer uploaded an image but we couldn't clearly identify the goods. Reassure them it's no problem, and ask if they'd like to proceed anyway (type yes) or re-upload a clearer image (type no).",
          null, messages,
          "I wasn't able to clearly identify the goods from the image. No worries — type yes to proceed anyway, or no to re-upload."
        );
        await addBot(noDetectMsg, 700);
      }
      setStep(STEPS.AWAITING_IMAGE_CONFIRM);
    } catch {
      setIsTyping(false);
      const skipMsg = await getAIResponse(
        "Image processing failed due to a technical issue. Tell the customer we'll skip that step and move to pricing.",
        null, messages,
        "Couldn't process the image right now. Let's skip that step and move ahead. 👍"
      );
      await addBot(skipMsg, 400);
      await showPriceMessage(calculatedPrice);
    }
  };

  // Accept price as param to avoid stale closure bug
  const showPriceMessage = async (priceOverride) => {
    const price = priceOverride ?? calculatedPrice;
    if (!price || isNaN(price)) {
      const noPriceMsg = await getAIResponse(
        "We couldn't calculate a price due to a technical issue. Apologize and ask them to start a new booking.",
        null, messages,
        "Sorry, I couldn't calculate a price right now. Please start a new booking. 😔"
      );
      await addBot(noPriceMsg, 400);
      return;
    }

    // ── Special conditions: Fixed price, NO negotiation ──
    // 1. Any High urgency shipment = Fixed
    // 2. Rain/Storm + Medium urgency = Fixed
    // 3. Rain/Storm + High urgency = Fixed
    const isNonNegotiable =
      currentUrgency === "High" ||
      (weatherSurge && (currentUrgency === "Medium" || currentUrgency === "High"));

    if (isNonNegotiable) {
      let reason, fallbackMsg;
      if (currentUrgency === "High") {
        reason = "This is a HIGH urgency delivery — the price is FIXED and non-negotiable. We need to secure the fastest available truck immediately, which limits flexibility. Ask them to type 'accept' to confirm or start a new booking with lower urgency.";
        fallbackMsg = `Your quote: ₹${price} 🚀 Since this is a high-urgency shipment, the price is fixed — we need to lock in the fastest truck immediately. Type accept to confirm your booking.`;
      } else {
        reason = "There is rain/storm weather surge pricing in effect with medium urgency. The price is FIXED because bad weather increases operational risk, fuel consumption, and driver hazard pay. Ask them to type 'accept' to confirm.";
        fallbackMsg = `Your quote: ₹${price} 🌧️ Due to current weather conditions (rain/storm) affecting this route, the price is fixed. This accounts for increased risk and operational costs. Type accept to confirm.`;
      }
      const fixedMsg = await getAIResponse(
        `Present the final price of ₹${price} to the customer. ${reason}`,
        { price, urgency: currentUrgency }, messages,
        fallbackMsg
      );
      await addBot(fixedMsg, 700);
      setStep(STEPS.ACCEPTED);
      setFinalPrice(price);
    } else {
      // ── Negotiable: Clear + Low (15% off) or Clear + Medium (10% off) ──
      const discountNote = currentUrgency === "Low"
        ? "up to 15% discount is possible for low urgency in clear weather"
        : "up to 10% discount is possible for medium urgency in clear weather";
      const priceMsg = await getAIResponse(
        `Present the estimated price of ₹${price} to the customer. This is based on distance, weight, and conditions. Tell them they can negotiate — ${discountNote}. They should type their offer amount (e.g. 5000) to make a counter-offer, or type "accept" to confirm at ₹${price}. Don't reveal the exact discount percentage to the customer.`,
        { price, urgency: currentUrgency }, messages,
        `Your estimated price is ₹${price} 💰 This is based on distance, weight, and current conditions. Want to negotiate? Just type your offer amount, or type accept to confirm at this price.`
      );
      await addBot(priceMsg, 800);
      setStep(STEPS.NEGOTIATING);
    }
  };

  const handleConfirmInput = async () => {
    const val = confirmInput.trim().toLowerCase();
    setConfirmInput("");
    if (!val) return;
    addUser(confirmInput.trim());

    if (val === "yes" || val === "y") {
      const confirmMsg = await getAIResponse(
        detectedLabel
          ? `The customer confirmed the detected goods (${detectedLabel}). Acknowledge it positively and let them know we'll assign the right vehicle. Then move to pricing.`
          : "The customer confirmed they want to proceed with their goods as declared. Acknowledge positively.",
        { detectedLabel }, messages,
        detectedLabel
          ? `Perfect! ✅ Confirmed — your shipment contains ${detectedLabel}. We'll make sure the right vehicle is assigned.`
          : "Got it! ✅ We'll proceed with your goods as declared."
      );
      await addBot(confirmMsg, 600);
      await showPriceMessage(calculatedPrice);
    } else if (val === "no" || val === "n") {
      const retryMsg = await getAIResponse(
        "The customer said the detected item was wrong. Reassure them and ask them to re-upload a clearer photo.",
        null, messages,
        "No problem! Let's try again — please re-upload a clearer image of your goods. 📸"
      );
      await addBot(retryMsg, 500);
      setStep(STEPS.AWAITING_IMAGE);
    } else {
      const clarifyMsg = await getAIResponse(
        "The customer typed something unclear (not yes or no) when confirming their goods. Gently ask them to type just yes or no.",
        null, messages,
        "I didn't catch that. 😊 Just type yes if the detected item is correct, or no to re-upload."
      );
      await addBot(clarifyMsg, 400);
      setStep(STEPS.AWAITING_IMAGE_CONFIRM);
    }
  };

  const handleNegotiationInput = async () => {
    const val = negotiationOffer.trim().toLowerCase();
    setNegotiationOffer("");
    if (!val) return;
    addUser(negotiationOffer.trim());

    // ── "accept" → confirm at the LAST counter-offer (never revert to original) ──
    if (val === "accept") {
      const acceptPrice = lastCounterOffer || calculatedPrice;
      const acceptMsg = await getAIResponse(
        `The customer typed "accept". Confirm their shipment at ₹${acceptPrice}. This was our last offered price. Sound warm, congratulate them, and tell them a verified driver will be assigned shortly. Don't mention any other price.`,
        { price: acceptPrice }, messages,
        `Done! 🎉 Your shipment is confirmed at ₹${acceptPrice}. A verified driver will be assigned shortly — you'll get a notification right here. Thanks for choosing TransLogic AI!`
      );
      await addBot(acceptMsg, 700);
      setFinalPrice(acceptPrice); setStep(STEPS.ACCEPTED);
      setLastCounterOffer(null); setNegotiationAttempts(0);
      return;
    }

    // ── Parse the offer number ──
    const offerNum = parseInt(val.replace(/[₹,\s]/g, ""));
    if (isNaN(offerNum) || offerNum <= 0) {
      const invalidMsg = await getAIResponse(
        `The customer typed "${val}" during negotiation which isn't a valid price. Gently remind them to enter a number (their offer in ₹) or type "accept" to confirm at ₹${lastCounterOffer || calculatedPrice}.`,
        { price: lastCounterOffer || calculatedPrice }, messages,
        `Hmm, I didn't catch a price there. Just type your offer amount (e.g. 5000) or type accept to confirm at ₹${lastCounterOffer || calculatedPrice}. 😊`
      );
      await addBot(invalidMsg, 400);
      return;
    }

    // ── Calculate minimum acceptable price based on urgency + weather ──
    // Clear + Low = up to 15% discount, Clear + Medium = up to 10% discount
    const maxDiscountPct = currentUrgency === "Low" ? 0.15 : 0.10;
    const minimumPrice = Math.round(calculatedPrice * (1 - maxDiscountPct));
    const currentRound = negotiationAttempts + 1;

    // ── Offer is at or above our last counter (or original) — instant accept ──
    const currentDealPrice = lastCounterOffer || calculatedPrice;
    if (offerNum >= currentDealPrice) {
      const dealMsg = await getAIResponse(
        `The customer offered ₹${offerNum} which is at or above our current price of ₹${currentDealPrice}. Accept immediately! Confirm at ₹${currentDealPrice} (our price, not their higher offer). Be warm and enthusiastic.`,
        { price: currentDealPrice, offer: offerNum }, messages,
        `That works perfectly! 🤝 Your shipment is locked in at ₹${currentDealPrice}. We'll connect you with a driver right away!`
      );
      await addBot(dealMsg, 700);
      setFinalPrice(currentDealPrice); setStep(STEPS.ACCEPTED);
      setNegotiationAttempts(0); setLastCounterOffer(null);
      return;
    }

    // ── Offer is within acceptable range (at or above minimum) — accept the offer ──
    if (offerNum >= minimumPrice) {
      const dealMsg = await getAIResponse(
        `The customer offered ₹${offerNum} which is within our acceptable range. Accept their offer. Sound like you're doing them a favor — "Let me check with operations... yes, we can make this work." Confirm at ₹${offerNum}.`,
        { price: calculatedPrice, offer: offerNum }, messages,
        `Let me check with the team... alright, ₹${offerNum} works! 🤝 We'll get this moving for you. Great deal for both sides!`
      );
      await addBot(dealMsg, 700);
      setFinalPrice(offerNum); setStep(STEPS.ACCEPTED);
      setNegotiationAttempts(0); setLastCounterOffer(null);
      return;
    }

    // ── Offer is extremely low (more than 25% below minimum) — firm rejection ──
    if (offerNum < minimumPrice * 0.75) {
      const rejectMsg = await getAIResponse(
        `You are Logix, an experienced Indian transport pricing negotiator. The customer offered ₹${offerNum} which is extremely low — way below operational costs. Our quoted price is ₹${calculatedPrice}. Politely but firmly reject. Mention real costs like fuel (₹100+/litre for diesel), tolls, driver bata, loading/unloading charges. Don't reveal our minimum. Suggest they make a more realistic offer. Keep it 2-3 sentences, natural tone.`,
        { price: calculatedPrice, offer: offerNum }, messages,
        `I understand you want the best rate, but ₹${offerNum} wouldn't even cover our fuel and toll costs for this route. Diesel alone is ₹100+ per litre these days. Could you come up a bit? We can definitely work something out. 😊`
      );
      await addBot(rejectMsg, 700);
      // Don't increment attempts for absurd offers — don't change counter-offer
      return;
    }

    // ── Normal negotiation: counter-offer that gradually decreases toward minimum ──
    // Round 1: counter at ~70% of the gap between minimum and quoted
    // Round 2: counter at ~45% of the gap
    // Round 3+: offer our final best (minimum price)
    const gap = calculatedPrice - minimumPrice;
    let counterPrice;

    if (currentRound === 1) {
      // First counter: stay closer to quoted price (70% of gap above minimum)
      counterPrice = Math.round(minimumPrice + gap * 0.70);
    } else if (currentRound === 2) {
      // Second counter: come down more (45% of gap above minimum)
      counterPrice = Math.round(minimumPrice + gap * 0.45);
    } else if (currentRound === 3) {
      // Third counter: almost at minimum (20% of gap above minimum)
      counterPrice = Math.round(minimumPrice + gap * 0.20);
    } else {
      // 4th round and beyond: give final best price
      counterPrice = minimumPrice;
    }

    // Make sure counter is always less than previous counter (gradual decrease)
    if (lastCounterOffer && counterPrice >= lastCounterOffer) {
      counterPrice = Math.round((lastCounterOffer + minimumPrice) / 2);
    }
    // Never go below minimum
    if (counterPrice < minimumPrice) counterPrice = minimumPrice;

    // ── Round 4+: Final offer — take it or leave it ──
    if (currentRound >= 4) {
      const finalMsg = await getAIResponse(
        `You are Logix, an experienced Indian transport negotiator. The customer offered ₹${offerNum} after ${currentRound} rounds of negotiation. Our absolute best price is ₹${minimumPrice}. This is our FINAL offer. Be respectful but firm — mention that this covers barely our operational costs (fuel, tolls, driver wages, vehicle maintenance). They can type "accept" to confirm at ₹${minimumPrice} or book elsewhere. Don't reveal we calculated this as a percentage. 2-3 sentences max.`,
        { price: calculatedPrice, offer: offerNum, counterOffer: minimumPrice }, messages,
        `Look, I've stretched as far as I can — ₹${minimumPrice} is genuinely our rock-bottom. That barely covers fuel, tolls, and driver bata on this route. Type accept to confirm, or I understand if you need to look elsewhere. 🙏`
      );
      await addBot(finalMsg, 700);
      setLastCounterOffer(minimumPrice);
      setNegotiationAttempts(currentRound);
      return;
    }

    // ── Normal counter-offer ──
    const roundContext = [
      "", // unused (0-indexed)
      `First round of negotiation. Customer offered ₹${offerNum}. Counter with ₹${counterPrice}. Sound understanding but explain that fuel costs, tolls, and driver allocation make it hard to go lower. Mention diesel is ₹100+/litre. Don't reveal your minimum.`,
      `Second round. Customer came back with ₹${offerNum}. Counter with ₹${counterPrice}. Acknowledge they're getting closer. Mention route conditions, loading charges, or driver availability to justify the price. Show slight flexibility — "I spoke with operations and we can bring it down to ₹${counterPrice}."`,
      `Third round. Customer offered ₹${offerNum}. Counter with ₹${counterPrice}. You're getting close to your limit. Sound like you're really trying — "This is tough but let me see what I can do." Mention this is nearly at cost for this route.`,
    ];

    const counterMsg = await getAIResponse(
      `You are Logix, an experienced Indian transport pricing negotiator for TransLogic AI. Our quoted price was ₹${calculatedPrice}. ${roundContext[currentRound] || roundContext[3]} The customer can type a new offer or type "accept" to confirm at ₹${counterPrice}. Keep it 2-3 sentences. Sound human, not robotic. Never repeat the same sentence structure. IMPORTANT: Counter with EXACTLY ₹${counterPrice} — do not invent your own number.`,
      { price: calculatedPrice, offer: offerNum, counterOffer: counterPrice }, messages,
      currentRound === 1
        ? `I appreciate the offer of ₹${offerNum}, but considering fuel costs, tolls, and driver allocation on this route, that's difficult for us. I can revise the quote to ₹${counterPrice} — that's the best I can do right now.`
        : currentRound === 2
        ? `₹${offerNum} — you're getting closer. Let me check with operations... alright, I can bring it down to ₹${counterPrice}. That's factoring in everything on this route.`
        : `I hear you at ₹${offerNum}. This is really tight for us, but I can do ₹${counterPrice}. That's nearly at cost with fuel and tolls. Type accept to lock it in.`
    );
    await addBot(counterMsg, 700);
    setLastCounterOffer(counterPrice);
    setNegotiationAttempts(currentRound);
  };

  // ── Handle reset ────────────────────────────────────────────────────────────
  const handleReset = async () => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    // Clear all localStorage chat state
    ["chatMessages","chatStep","bookedLoadId","finalPrice","bookingState","activeLoad",
     "chatMapData","calculatedPrice","weatherSurge","currentUrgency",
     "chatLastPickup","chatLastDrop","chatLastWeight","chatLastUrgency",
     "chatLastPickupLat","chatLastPickupLng","chatLastDistanceKm",
     "chatNegotiationAttempts","chatLastCounterOffer"]
      .forEach(k => localStorage.removeItem(k));
    sessionStorage.removeItem("chatWelcomedBack");
    setMessages([]); setStep(STEPS.IDLE);
    setCalculatedPrice(null); setFinalPrice(null);
    setNegotiationAttempts(0); setDetectedLabel(null);
    setBookingState("idle"); setBookedLoadId(null);
    setDriverAccepted(false); setWeatherSurge(false);
    setLastCounterOffer(null);
    const fallbackGreeting = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
    const aiGreeting = await getAIResponse(
      "The customer started a brand new chat session. Greet them as Logix with a fresh, unique greeting. Ask for their pickup location, drop location, weight, and urgency. Make it feel warm and different from any previous greeting.",
      null, [],
      fallbackGreeting
    );
    await addBot(aiGreeting, 500);
  };

  // ── Poll load status until driver accepts ──────────────────────────────────────────
  const startPolling = (loadId) => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/logistics/load/${loadId}`);
        if (!res.ok) return;
        const load = await res.json();
        if (load.status === "Assigned" && load.driver) {
          clearInterval(pollTimerRef.current);
          setDriverAccepted(true);
          localStorage.setItem("activeLoad", JSON.stringify(load));
          setMessages(prev => [...prev, {
            sender: "bot",
            time: now(),
            text: `🎉 **Great news! A driver has accepted your load!**\n\n` +
              `🚛 **Driver:** ${load.driver.name}\n` +
              `📞 **Phone:** ${load.driver.phone}\n` +
              `📍 **Location:** ${load.driver.location || "En route"}\n\n` +
              `Your shipment from **${load.pickup} → ${load.drop}** is now **Assigned**. ` +
              `You can track your shipment live below! 📍`,
            isTrackCard: true,  // flag to render Track button
          }]);
        }
      } catch { /* silent */ }
    }, 10000); // poll every 10 seconds
  };

  // ── Handle Book Truck Now ─────────────────────────────────────────────────
  const handleBookNow = async () => {
    if (bookingState === "booked") return;
    setBookingState("booking");
    try {
      let customerName = "Guest", customerPhone = "0000000000";
      const cd = JSON.parse(localStorage.getItem("customerData") || "null");
      if (cd) { customerName = cd.fullName || cd.name || "Guest"; customerPhone = cd.phone || "0000000000"; }

      // Call /book (NOT /logistics) — creates ONE Pending load in MongoDB
      const res = await fetch(`${API_BASE}/api/logistics/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickup:        lastPickup,
          drop:          lastDrop,
          weight:        parseFloat(lastWeight),
          urgency:       lastUrgency,
          cargo:         "General Goods",
          customerName,
          customerPhone,
          price:         finalPrice,
          distanceKm:    lastDistanceKm,
          pickupLat:     lastPickupLat,
          pickupLng:     lastPickupLng,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Booking failed");

      // Persist booking info
      setBookedLoadId(data.loadId);
      setBookingState("booked");
      localStorage.setItem("bookedLoadId",   data.loadId);
      localStorage.setItem("finalPrice",      String(finalPrice));
      localStorage.setItem("bookingState",    "booked");

      // Add notification to customer's bell
      const notifs = JSON.parse(localStorage.getItem("customerNotifications") || "[]");
      notifs.unshift({
        title: "✅ Booking Confirmed!",
        message: `Your truck from ${lastPickup} → ${lastDrop} is booked at ₹${finalPrice}. Looking for a driver...`,
        time: new Date().toISOString(),
        read: false,
      });
      localStorage.setItem("customerNotifications", JSON.stringify(notifs.slice(0, 20)));

      const bookMsg = await getAIResponse(
        `The booking is now confirmed! Tell the customer their truck from ${lastPickup} to ${lastDrop} is booked at the confirmed price. Let them know we're now searching for a driver near the pickup location and it usually takes 5-10 minutes. Tell them they'll be notified right here in the chat when a driver accepts.`,
        { pickup: lastPickup, drop: lastDrop, price: finalPrice }, messages,
        `✅ Booking Confirmed! Your truck from ${lastPickup} → ${lastDrop} has been booked at ₹${finalPrice}. We are searching for a driver near ${lastPickup}... This usually takes 5–10 minutes. We'll notify you right here in the chat as soon as a driver accepts your load! 🔔`
      );
      await addBot(bookMsg, 700);

      // Start polling for driver acceptance
      startPolling(data.loadId);
    } catch (err) {
      setBookingState("error");
      const failMsg = await getAIResponse(
        "The booking failed due to a technical error. Apologize and ask them to try again or contact support.",
        null, messages,
        "❌ Booking failed. Please try again or call support."
      );
      await addBot(failMsg, 400);
    }
  };

  return (
    <>
      <style>{`
        .chat-container { display: flex; flex-direction: column; height: 100%; font-family: 'Inter', sans-serif; }
        .chat-header { background: linear-gradient(135deg, #1e3a8a 0%, #6d28d9 100%); padding: 14px 16px; display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
        .chat-header-avatar { width: 40px; height: 40px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
        .chat-header-info { flex: 1; min-width: 0; }
        .chat-header-name { color: #fff; font-weight: 700; font-size: 15px; letter-spacing: 0.3px; }
        .chat-header-status { color: #c4b5fd; font-size: 11px; display: flex; align-items: center; gap: 5px; }
        .chat-header-dot { width: 7px; height: 7px; border-radius: 50%; background: #4ade80; display: inline-block; }
        .chat-new-btn { background: rgba(255,255,255,0.15); border: none; color: #fff; border-radius: 8px; padding: 6px 12px; cursor: pointer; font-size: 12px; font-weight: 600; white-space: nowrap; }
        .chat-messages { flex: 1; overflow-y: auto; padding: 14px 12px; background: #f8fafc; display: flex; flex-direction: column; gap: 6px; }
        .chat-input-area { background: #fff; border-top: 1px solid #e2e8f0; padding: 12px 14px; flex-shrink: 0; }
        .chat-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .chat-form-grid .full-width { grid-column: 1 / -1; }
        .chat-input { border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; font-size: 13px; outline: none; background: #f8fafc; color: #1e293b; transition: border 0.2s; width: 100%; box-sizing: border-box; font-family: inherit; }
        .chat-input:focus { border-color: #3b82f6; }
        .chat-select { border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; font-size: 13px; outline: none; background: #f8fafc; color: #1e293b; width: 100%; box-sizing: border-box; font-family: inherit; }
        .chat-primary-btn { width: 100%; padding: 12px 16px; border-radius: 12px; border: none; background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: #fff; font-weight: 700; font-size: 14px; cursor: pointer; box-shadow: 0 4px 14px rgba(59,130,246,0.35); transition: opacity 0.2s; font-family: inherit; }
        .chat-ghost-btn { background: none; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 9px 16px; color: #64748b; font-size: 13px; cursor: pointer; font-weight: 500; width: 100%; font-family: inherit; }
        .chat-inline-row { display: flex; gap: 8px; }
        .chat-inline-row .chat-input { flex: 1; }
        .chat-price-card { background: linear-gradient(135deg, #d1fae5, #a7f3d0); border: 1px solid #6ee7b7; border-radius: 12px; padding: 10px 20px; text-align: center; width: 100%; box-sizing: border-box; }
        .chat-price-label { font-size: 12px; color: #065f46; font-weight: 500; }
        .chat-price-value { font-size: 24px; font-weight: 800; color: #047857; }
        .chat-booked-card { width: 100%; padding: 12px; border-radius: 12px; text-align: center; background: #dcfce7; border: 1px solid #86efac; color: #166534; font-weight: 700; font-size: 14px; box-sizing: border-box; }
        .chat-track-btn { width: 100%; padding: 12px; border-radius: 12px; text-align: center; text-decoration: none; background: linear-gradient(135deg, #0ea5e9, #06b6d4); color: #fff; font-weight: 700; font-size: 14px; box-shadow: 0 4px 14px rgba(6,182,212,0.35); display: block; box-sizing: border-box; }
        @media (max-width: 480px) {
          .chat-form-grid { grid-template-columns: 1fr; }
          .chat-header { padding: 10px 12px; }
          .chat-header-avatar { width: 36px; height: 36px; font-size: 18px; }
          .chat-header-name { font-size: 14px; }
          .chat-messages { padding: 10px 8px; }
          .chat-input-area { padding: 10px; }
          .chat-price-value { font-size: 20px; }
        }
      `}</style>
      <div className="chat-container">
        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-avatar">🤖</div>
          <div className="chat-header-info">
            <div className="chat-header-name">Logix — TransLogic AI</div>
            <div className="chat-header-status">
              <span className="chat-header-dot" />
              Online • Always here to help
            </div>
          </div>
          <button onClick={handleReset} className="chat-new-btn">+ New</button>
        </div>

        {/* Messages */}
        <div className="chat-messages">
          {messages.map((msg, idx) => (
            <MessageBubble key={idx} text={msg.text} sender={msg.sender} time={msg.time} isTrackCard={!!msg.isTrackCard} />
          ))}
          {isTyping && <TypingIndicator />}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="chat-input-area">
          {/* IDLE — booking form */}
          {step === STEPS.IDLE && (
            <div className="chat-form-grid">
              <input className="chat-input" placeholder="📍 Pickup location" value={pickup} onChange={e => setPickup(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSend()} />
              <input className="chat-input" placeholder="🏁 Drop location" value={drop} onChange={e => setDrop(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSend()} />
              <input type="number" className="chat-input" placeholder="⚖️ Weight (kg)" value={weight} onChange={e => setWeight(e.target.value)} />
              <select className="chat-select" value={urgency} onChange={e => setUrgency(e.target.value)}>
                <option value="Low">🐢 Low Urgency</option>
                <option value="Medium">⚡ Medium</option>
                <option value="High">🚨 High Urgency</option>
              </select>
              <button onClick={handleSend} className="chat-primary-btn full-width">
                🚀 Get Instant Quote
              </button>
            </div>
          )}

          {/* Image Upload */}
          {step === STEPS.AWAITING_IMAGE && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
              <button onClick={() => fileInputRef.current?.click()} className="chat-primary-btn" style={{ background: "linear-gradient(135deg, #6d28d9, #8b5cf6)" }}>
                📸 Upload Image of Goods
              </button>
              <button onClick={async () => { addUser("Skip image upload"); await showPriceMessage(calculatedPrice); }} className="chat-ghost-btn">
                Skip this step →
              </button>
            </div>
          )}

          {/* Image Confirm */}
          {step === STEPS.AWAITING_IMAGE_CONFIRM && (
            <div className="chat-inline-row">
              <input className="chat-input" placeholder="Type yes or no…" value={confirmInput}
                onChange={e => setConfirmInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleConfirmInput()} />
              <button onClick={handleConfirmInput} className="chat-primary-btn" style={{ width: "auto", padding: "10px 18px" }}>Send</button>
            </div>
          )}

          {/* Negotiation */}
          {step === STEPS.NEGOTIATING && (
            <div className="chat-inline-row">
              <input className="chat-input" placeholder='Your offer (e.g. 4500) or "accept"'
                value={negotiationOffer} onChange={e => setNegotiationOffer(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleNegotiationInput()} />
              <button onClick={handleNegotiationInput} className="chat-primary-btn" style={{ width: "auto", padding: "10px 18px" }}>Send</button>
            </div>
          )}

          {/* Accepted — Book button */}
          {step === STEPS.ACCEPTED && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
              <div className="chat-price-card">
                <div className="chat-price-label">Final Price Confirmed</div>
                <div className="chat-price-value">₹{finalPrice}</div>
              </div>
              {bookingState === "booked" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", alignItems: "center" }}>
                  <div className="chat-booked-card">✅ Booking Confirmed! Drivers are being notified.</div>
                  <a href="/track" className="chat-track-btn">📍 Track Your Shipment →</a>
                </div>
              ) : (
                <button
                  onClick={handleBookNow}
                  disabled={bookingState === "booking"}
                  className="chat-primary-btn"
                  style={{
                    opacity: bookingState === "booking" ? 0.7 : 1,
                    background: "linear-gradient(135deg,#1e3a8a,#3b82f6)",
                  }}>
                  {bookingState === "booking" ? "⏳ Booking..." : "🚚 Book Truck Now"}
                </button>
              )}
              <button onClick={handleReset} className="chat-ghost-btn">Start a New Booking</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default ChatApp;
