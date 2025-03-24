<template>
    <div class="about">
        <h1>About MyPlan</h1>

        <label>
            Version:
            <output>TODO...</output>
        </label>
        <label>
            Author:
            <output>Benoît Mariat</output>
        </label>
        <label>
            Licence:
            <output>MIT</output>
        </label>

        <figure>
            <img src="@/assets/url.png" alt="url to https://restimel.github.io/myPlan">
            <figcaption>
                https://restimel.github.io/myPlan
            </figcaption>
        </figure>
    </div>
</template>

<style scoped>
.about {
  padding: var(--section-padding);
}

label {
  display: block;
  font-weight: 700;
}

output {
  font-weight: normal;
}

figure {
  text-align: center;
}
</style>
