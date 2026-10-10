import random
from typing import List, Dict, Any, Tuple
import math

class Universe:
    def __init__(self, name: str):
        self.name = name
        self.bodies: List[CelestialBody] = []
        self.physical_laws = PhysicalLaws()
        print(f"Universe '{name}' created. Billing starts now.")

    def add_body(self, body: 'CelestialBody') -> None:
        self.bodies.append(body)
        print(f"{body.name} added to {self.name} (bodies: {len(self.bodies)}).")

    def remove_body(self, body: 'CelestialBody') -> None:
        if body in self.bodies:
            self.bodies.remove(body)
            print(f"{body.name} removed from {self.name}. Hopefully it was not load-bearing.")
        else:
            print(f"{body.name} is not in {self.name}. Nothing removed.")

    def big_bang(self) -> None:
        print(f"Big Bang in {self.name}. Previous contents discarded.")

    def heat_death(self) -> None:
        print(f"{self.name} has reached heat death. Nothing further will happen here.")

class CelestialBody:
    def __init__(self, name: str, type: str):
        self.name = name
        self.type = type
        print(f"{name} created ({type}). Not yet placed in a universe.")

    def set_orbit(self, orbiting_body_name: str, distance: float) -> None:
        print(f"{self.name} now orbits {orbiting_body_name} at {distance} m.")

    def collide(self, other: 'CelestialBody') -> None:
        print(f"{self.name} collided with {other.name}. Debris field logged.")

class LifeForm:
    def __init__(self, name: str, planet: CelestialBody):
        self.name = name
        self.planet = planet
        print(f"{name} registered on {planet.name}. Population 0: call create_population().")

    def create_population(self, size: int) -> None:
        print(f"{size:,} {self.name} on {self.planet.name}.")

    def extinct_population(self) -> None:
        print(f"{self.name} on {self.planet.name}: extinct. Logged.")

    def evolve(self, years: int) -> None:
        print(f"{self.name} evolved for {years:,} years. Appendage count unchanged, for now.")

class Weather:
    def __init__(self, planet: CelestialBody):
        self.planet = planet
        print(f"Weather control attached to {planet.name}.")

    def set_rain(self, duration: int) -> None:
        print(f"Rain on {self.planet.name} for {duration} min.")

    def set_sun(self, duration: int) -> None:
        print(f"Clear skies on {self.planet.name} for {duration} min.")

    def create_storm(self, intensity: int) -> None:
        print(f"Storm, intensity {intensity}, on {self.planet.name}. Expect population losses.")

class BlackHole:
    def __init__(self, name: str, mass: float):
        self.name = name
        self.mass = mass
        print(f"Black hole '{name}' created (mass {mass:g} kg). Not yet placed.")

    def place_black_hole(self, location: str) -> None:
        print(f"{self.name} placed at {location}. Local real estate values may be affected.")

    def consume(self, object: str) -> None:
        print(f"{self.name} consumed {object}. It will not be giving it back.")

class PhysicalLaws:
    def __init__(self):
        self.gravitational_constant = 6.67430e-11
        self.speed_of_light = 299792458
        self.planck_constant = 6.62607015e-34

    def set_gravitational_constant(self, value: float) -> None:
        self.gravitational_constant = value
        print(f"G = {value:g} m³ kg⁻¹ s⁻² (×{value / 6.67430e-11:.2f}). Stellar output scales as G⁴.")

    def set_speed_of_light(self, value: float) -> None:
        self.speed_of_light = value
        print(f"c = {value:,} m/s. Photons are complying.")

    def set_planck_constant(self, value: float) -> None:
        self.planck_constant = value
        print(f"h = {value:g} J s (×{value / 6.62607015e-34:.2f}).")

class Time:
    def __init__(self):
        self.current_year = 2024

    def speed_up(self, factor: float) -> None:
        print(f"Time rate ×{factor}.")

    def slow_down(self, factor: float) -> None:
        print(f"Time rate ÷{factor}.")

    def pause(self) -> None:
        print("Time paused.")

    def resume(self) -> None:
        print("Time resumed.")

    def travel(self, year: int) -> None:
        direction = "future" if year > self.current_year else "past"
        print(f"Travelled to year {year} ({direction}). Causality is your problem now.")
        self.current_year = year

class QuantumMechanics:
    def __init__(self):
        self.particles = []

    def create_particle(self, name: str, spin: float) -> None:
        self.particles.append({"name": name, "spin": spin})
        print(f"Particle '{name}' created, spin {spin}. State: undetermined until observed.")

    def entangle(self, particle1: str, particle2: str) -> None:
        print(f"{particle1} and {particle2} entangled. Measuring one will settle the other, at any distance.")

    def collapse_wave_function(self, particle: str) -> str:
        state = random.choice(["up", "down"])
        print(f"{particle} collapsed: {state}.")
        return state

class DarkMatter:
    def increase_density(self, amount: float) -> None:
        print(f"Dark matter density +{amount}.")

    def decrease_density(self, amount: float) -> None:
        print(f"Dark matter density -{amount}.")

class DarkEnergy:
    def increase_intensity(self, amount: float) -> None:
        print(f"Dark energy intensity +{amount}. Expansion accelerating.")

    def decrease_intensity(self, amount: float) -> None:
        print(f"Dark energy intensity -{amount}.")

class GeneticCode:
    def __init__(self, organism: str):
        self.organism = organism
        print(f"Genome of {organism} opened.")

    def edit_gene(self, gene: str, new_value: str) -> None:
        print(f"{self.organism}: {gene} = {new_value}.")

    def clone(self) -> str:
        clone_name = f"Clone of {self.organism}"
        print(f"{clone_name} created.")
        return clone_name

    def splice(self, other_organism: str) -> str:
        hybrid_name = f"{self.organism}-{other_organism} Hybrid"
        print(f"{hybrid_name} created. Nobody asked for this.")
        return hybrid_name

class Ecosystem:
    def __init__(self, planet: CelestialBody):
        self.planet = planet
        self.species = []

    def add_species(self, species: str) -> None:
        self.species.append(species)
        print(f"{species} added to the ecosystem of {self.planet.name}.")

    def remove_species(self, species: str) -> None:
        if species in self.species:
            self.species.remove(species)
            print(f"{species} removed from {self.planet.name}.")
        else:
            print(f"{species} not found on {self.planet.name}.")

class Energy:
    @staticmethod
    def create_energy_source(type: str, output: float) -> None:
        print(f"{type} energy source online: {output} GW.")

    @staticmethod
    def convert_matter_to_energy(mass: float) -> float:
        energy = mass * (299792458 ** 2)  # E = mc^2
        print(f"{mass} kg -> {energy:.3e} J.")
        return energy

class CosmicEvent:
    @staticmethod
    def supernova(star_name: str) -> None:
        print(f"{star_name} went supernova. Nearby biospheres sterilised.")

    @staticmethod
    def gamma_ray_burst(duration: float) -> None:
        print(f"Gamma-ray burst, {duration} s. The beam direction is not negotiable.")

class Multiverse:
    def __init__(self):
        self.universes = []

    def create_universe(self, name: str) -> Universe:
        new_universe = Universe(name)
        self.universes.append(new_universe)
        print(f"Universe '{name}' added to the multiverse ({len(self.universes)} total).")
        return new_universe

    def merge_universes(self, universe1: Universe, universe2: Universe) -> Universe:
        merged_name = f"{universe1.name}-{universe2.name}"
        merged_universe = Universe(merged_name)
        print(f"{universe1.name} and {universe2.name} merged into {merged_name}. Constants averaged.")
        return merged_universe

class Dimension:
    def __init__(self, universe: Universe):
        self.universe = universe
        self.num_dimensions = 4  # 3 spatial + 1 time

    def add_dimension(self) -> None:
        self.num_dimensions += 1
        print(f"{self.universe.name}: {self.num_dimensions} dimensions. Closed orbits are no longer stable.")

    def remove_dimension(self) -> None:
        if self.num_dimensions > 1:
            self.num_dimensions -= 1
            print(f"{self.universe.name}: {self.num_dimensions} dimensions.")
        else:
            print(f"Cannot remove a dimension from {self.universe.name}. One is the minimum.")

class Wormhole:
    def __init__(self, entrance: str, exit: str):
        self.entrance = entrance
        self.exit = exit
        print(f"Wormhole open: {entrance} <-> {exit}. Keep extremities inside the throat.")

    def traverse(self, object: str) -> None:
        print(f"{object} traversed {self.entrance} -> {self.exit}.")

def main():
    print("GodMod 2.0 - reality control suite.")
    
    multiverse = Multiverse()
    universe = multiverse.create_universe("Testbed")
    
    universe.big_bang()
    
    earth = CelestialBody("Earth", "planet")
    universe.add_body(earth)
    
    mars = CelestialBody("Mars", "planet")
    universe.add_body(mars)
    
    humans = LifeForm("Humans", earth)
    humans.create_population(7_000_000_000)
    humans.evolve(1000000)
    
    weather = Weather(earth)
    weather.set_rain(60)
    weather.create_storm(5)
    
    black_hole = BlackHole("Gargantua", 1e30)
    black_hole.place_black_hole("GalacticCenter")
    black_hole.consume("Asteroid")
    
    universe.physical_laws.set_speed_of_light(299792459)  # Oops, off by 1!
    
    time = Time()
    time.speed_up(2)
    time.travel(3000)
    
    quantum = QuantumMechanics()
    quantum.create_particle("q1", 0.5)
    quantum.create_particle("q2", 0.5)
    quantum.entangle("q1", "q2")
    quantum.collapse_wave_function("q1")
    
    dark_matter = DarkMatter()
    dark_matter.increase_density(0.1)
    
    dark_energy = DarkEnergy()
    dark_energy.increase_intensity(0.2)
    
    dna = GeneticCode("Platypus")
    dna.edit_gene("BillShape", "Square")
    hybrid = dna.splice("Giraffe")
    
    ecosystem = Ecosystem(earth)
    ecosystem.add_species("Tardigrades")
    
    Energy.create_energy_source("Antimatter", 9000)
    Energy.convert_matter_to_energy(0.001)
    
    CosmicEvent.supernova("Betelgeuse")
    CosmicEvent.gamma_ray_burst(10.5)
    
    dimension = Dimension(universe)
    dimension.add_dimension()
    
    wormhole = Wormhole("Milky Way", "Andromeda")
    wormhole.traverse("Space Whale")
    
    print("\nSession complete. 1 universe modified, 1 constant off by one.")
    print("Use responsibly. Side effects may include parallel universes and time paradoxes.")

if __name__ == "__main__":
    main()
