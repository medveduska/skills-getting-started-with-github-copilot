document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const activityCardTemplate = document.getElementById("activity-card-template");
  const initialActivityOption = '<option value="">-- Select an activity --</option>';
  let messageHideTimeoutId = null;

  function showMessage(message, type) {
    messageDiv.textContent = message;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    if (messageHideTimeoutId !== null) {
      clearTimeout(messageHideTimeoutId);
    }

    messageHideTimeoutId = setTimeout(() => {
      messageDiv.classList.add("hidden");
      messageHideTimeoutId = null;
    }, 5000);
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: "no-store" });
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = initialActivityOption;

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCardFragment = activityCardTemplate.content.cloneNode(true);
        const activityCard = activityCardFragment.querySelector(".activity-card");
        const activityName = activityCardFragment.querySelector(".activity-name");
        const activityDescription = activityCardFragment.querySelector(".activity-description");
        const activitySchedule = activityCardFragment.querySelector(".activity-schedule");
        const activityAvailability = activityCardFragment.querySelector(".activity-availability");
        const participantsList = activityCardFragment.querySelector(".participants-list");
        const participantsEmpty = activityCardFragment.querySelector(".participants-empty");

        const participants = Array.isArray(details.participants) ? details.participants : [];
        const spotsLeft = details.max_participants - participants.length;

        activityName.textContent = name;
        activityDescription.textContent = details.description;
        activitySchedule.textContent = details.schedule;
        activityAvailability.textContent = `${spotsLeft} spots left`;

        if (participants.length > 0) {
          participantsEmpty.classList.add("hidden");
          participantsList.classList.remove("hidden");

          participants.forEach((participant) => {
            const listItem = document.createElement("li");
            const participantEmail = document.createElement("span");
            participantEmail.className = "participant-email";
            participantEmail.textContent = participant;

            const removeButton = document.createElement("button");
            removeButton.type = "button";
            removeButton.className = "participant-remove-btn";
            removeButton.textContent = "x";
            removeButton.title = `Remove ${participant}`;
            removeButton.setAttribute("aria-label", `Remove ${participant} from ${name}`);
            removeButton.dataset.activity = name;
            removeButton.dataset.participant = participant;

            listItem.appendChild(participantEmail);
            listItem.appendChild(removeButton);
            participantsList.appendChild(listItem);
          });
        }

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  activitiesList.addEventListener("click", async (event) => {
    const button = event.target.closest(".participant-remove-btn");

    if (!button) {
      return;
    }

    const activity = button.dataset.activity;
    const participant = button.dataset.participant;

    if (!activity || !participant) {
      return;
    }

    button.disabled = true;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(participant)}`,
        {
          method: "POST",
        }
      );
      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        await fetchActivities();
      } else {
        showMessage(result.detail || "Could not unregister participant.", "error");
      }
    } catch (error) {
      showMessage("Failed to unregister participant. Please try again.", "error");
      console.error("Error unregistering participant:", error);
    } finally {
      button.disabled = false;
    }
  });

  // Initialize app
  fetchActivities();
});
